import { Injectable } from '@nestjs/common';
import {
  AiAdjustmentFactor,
  EloRatingFactor,
  FormFactor,
  GoalsFactor,
  HeadToHeadFactor,
  OddsFactor,
} from './factors';
import {
  AutoWeightingResult,
  CalibrationParameters,
  FactorContribution,
  PredictionEngineInput,
  PredictionEngineOutput,
  PredictionFactor,
  PredictionFactorKey,
  ProbabilityTriplet,
  ScoreBreakdown,
  ScoreCandidate,
  ScoreModelMeta,
  TotalGoalsDistribution,
} from './prediction-engine.types';
import { exactHundred, normalizeTriplet } from './prediction-engine.utils';

const MODEL_VERSION = 'prediction-engine-v3-calibrated';
const V1_WEIGHTS: Record<PredictionFactorKey, number> = {
  elo: 35,
  form: 25,
  recent5: 15,
  recent10: 10,
  headToHead: 15,
  goals: 20,
  attack: 10,
  defense: 10,
  aiAdjustment: 5,
  venue: 0,
  worldRanking: 0,
  injuries: 0,
  odds: 18,
};

@Injectable()
export class PredictionEngineService {
  private readonly factors: PredictionFactor[] = [
    new EloRatingFactor(),
    new FormFactor(),
    new HeadToHeadFactor(),
    new GoalsFactor(),
    new OddsFactor(),
    new AiAdjustmentFactor(),
  ];

  predict(input: PredictionEngineInput): PredictionEngineOutput {
    const contributions = this.factors.map((factor) => {
      const weight = this.resolveWeight(factor.key, factor.defaultWeight, input);
      return factor.evaluate({ ...input, weight });
    });

    const available = contributions.filter((factor) => factor.available);
    const warnings = contributions
      .filter((factor) => !factor.available)
      .map((factor) => factor.reason);

    const adjustedCombined = this.applyV2PreMatchAdjustments(
      this.combine(available),
      input,
    );
    const autoWeighting = this.autoWeighting(input, adjustedCombined, warnings.length);
    const combined = this.applyAutoWeighting(adjustedCombined, input, autoWeighting);
    const exact = exactHundred(combined);
    const recommendationDirection = this.recommendationDirection(exact);
    const expectedGoals = this.expectedGoals(input, exact);
    const scoreModel = this.scoreModel(
      expectedGoals.home,
      expectedGoals.away,
      input,
    );
    const scoreCandidates = scoreModel.scoreCandidates;
    const recommendedScore = scoreCandidates[0] ?? this.scoreFromExpected(expectedGoals);
    const riskBreakdown = this.riskBreakdown(exact, available, warnings.length, input);
    const confidenceBreakdown = this.confidenceBreakdown(
      exact,
      available,
      warnings.length,
      riskBreakdown.score,
      input,
    );
    const confidenceScore = confidenceBreakdown.score;
    const riskScore = riskBreakdown.score;

    return {
      homeWinProbability: exact.homeWin,
      drawProbability: exact.draw,
      awayWinProbability: exact.awayWin,
      recommendationDirection,
      recommendedScore,
      scoreCandidates,
      totalGoalsRange: scoreModel.totalGoalsRange,
      overUnderLean: scoreModel.overUnderLean,
      totalGoalsDistribution: scoreModel.totalGoalsDistribution,
      scoreModelMeta: scoreModel.meta,
      riskLevel: this.riskLevel(riskScore),
      confidenceLevel: this.confidenceLevel(confidenceScore),
      confidenceScore,
      riskScore,
      confidenceBreakdown,
      riskBreakdown,
      total: 100,
      modelVersion: MODEL_VERSION,
      calibration: this.effectiveCalibration(input),
      autoWeighting,
      factors: contributions,
      warnings,
    };
  }

  listFactors() {
    return this.factors.map((factor) => ({
      key: factor.key,
      label: factor.label,
      defaultWeight: V1_WEIGHTS[factor.key],
    }));
  }

  getModelVersion() {
    return MODEL_VERSION;
  }

  getWeightConfig() {
    return { ...V1_WEIGHTS };
  }

  private combine(factors: FactorContribution[]): ProbabilityTriplet {
    const totalWeight = factors.reduce((sum, factor) => sum + factor.weight, 0);

    if (totalWeight <= 0 || factors.length === 0) {
      return { homeWin: 34, draw: 32, awayWin: 34 };
    }

    return normalizeTriplet({
      homeWin:
        factors.reduce(
          (sum, factor) => sum + factor.probability.homeWin * factor.weight,
          0,
        ) / totalWeight,
      draw:
        factors.reduce(
          (sum, factor) => sum + factor.probability.draw * factor.weight,
          0,
        ) / totalWeight,
      awayWin:
        factors.reduce(
          (sum, factor) => sum + factor.probability.awayWin * factor.weight,
          0,
        ) / totalWeight,
    });
  }

  private resolveWeight(
    key: PredictionFactorKey,
    defaultWeight: number,
    input: PredictionEngineInput,
  ) {
    const override = input.factorWeights?.[key];
    if (override === undefined || override === null) {
      return V1_WEIGHTS[key] ?? defaultWeight;
    }

    return Math.max(0, Number(override) || 0);
  }

  private recommendationDirection(probability: ProbabilityTriplet) {
    if (
      probability.homeWin >= probability.draw &&
      probability.homeWin >= probability.awayWin
    ) {
      return 'HOME_WIN' as const;
    }

    if (
      probability.awayWin >= probability.homeWin &&
      probability.awayWin >= probability.draw
    ) {
      return 'AWAY_WIN' as const;
    }

    return 'DRAW' as const;
  }

  private expectedGoals(
    input: PredictionEngineInput,
    probability: ProbabilityTriplet,
  ) {
    const homeAttack = input.homeTeam.attackIndex ?? 50;
    const awayAttack = input.awayTeam.attackIndex ?? 50;
    const homeDefense = input.homeTeam.defenseIndex ?? 50;
    const awayDefense = input.awayTeam.defenseIndex ?? 50;
    const formEdge =
      ((input.homeTeam.recent5?.formScore ?? input.homeTeam.recent10?.formScore ?? 50) -
        (input.awayTeam.recent5?.formScore ?? input.awayTeam.recent10?.formScore ?? 50)) /
      100;

    const homeExpected =
      1.1 +
      (homeAttack - 50) / 45 -
      (awayDefense - 50) / 70 +
      (probability.homeWin - probability.awayWin) / 140 +
      formEdge * 0.35;
    const awayExpected =
      1.05 +
      (awayAttack - 50) / 45 -
      (homeDefense - 50) / 70 +
      (probability.awayWin - probability.homeWin) / 140 -
      formEdge * 0.25;

    return {
      home: this.clampExpectedGoals(homeExpected),
      away: this.clampExpectedGoals(awayExpected),
    };
  }

  private scoreFromExpected(expected: { home: number; away: number }) {
    const home = this.clampScore(expected.home);
    const away = this.clampScore(expected.away);
    return {
      home,
      away,
      text: `${home}-${away}`,
    };
  }

  private scoreModel(
    homeExpectedGoals: number,
    awayExpectedGoals: number,
    input: PredictionEngineInput,
  ): {
    scoreCandidates: ScoreCandidate[];
    totalGoalsRange: '0-1球' | '2-3球' | '4球以上';
    overUnderLean: '偏小' | '均衡' | '偏大';
    totalGoalsDistribution: TotalGoalsDistribution;
    meta: ScoreModelMeta;
  } {
    const rawCandidates: ScoreCandidate[] = [];
    const calibration = this.effectiveCalibration(input);
    const styleGoalMultiplier = this.styleGoalMultiplier(input);
    const calibratedStyleMultiplier = this.clamp(
      styleGoalMultiplier * (calibration.styleGoalMultiplier ?? 1),
      0.82,
      1.22,
    );
    const adjustedHomeExpectedGoals = this.clampExpectedGoals(
      homeExpectedGoals * calibratedStyleMultiplier,
    );
    const adjustedAwayExpectedGoals = this.clampExpectedGoals(
      awayExpectedGoals * calibratedStyleMultiplier,
    );
    const dixonColesRho = calibration.dixonColesRho ?? -0.08;

    for (let home = 0; home <= 4; home += 1) {
      for (let away = 0; away <= 4; away += 1) {
        const poissonProbability =
          this.poissonProbability(home, adjustedHomeExpectedGoals) *
          this.poissonProbability(away, adjustedAwayExpectedGoals);
        rawCandidates.push({
          home,
          away,
          text: `${home}-${away}`,
          probability:
            poissonProbability *
            this.dixonColesAdjustment(
              home,
              away,
              adjustedHomeExpectedGoals,
              adjustedAwayExpectedGoals,
              dixonColesRho,
            ),
          totalGoals: home + away,
          rank: 0,
        });
      }
    }

    const totalProbability =
      rawCandidates.reduce((sum, candidate) => sum + candidate.probability, 0) ||
      1;
    const normalized = rawCandidates.map((candidate) => ({
      ...candidate,
      probability: (candidate.probability / totalProbability) * 100,
    }));
    const totalGoalsDistribution = this.totalGoalsDistribution(normalized);
    const totalExpectedGoals =
      adjustedHomeExpectedGoals + adjustedAwayExpectedGoals;
    const overUnderLean =
      totalExpectedGoals < 2.25
        ? ('偏小' as const)
        : totalExpectedGoals > 2.85
          ? ('偏大' as const)
          : ('均衡' as const);

    return {
      scoreCandidates: normalized
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 3)
      .map((candidate, index) => ({
        ...candidate,
        rank: index + 1,
        probability: Number(candidate.probability.toFixed(2)),
      })),
      totalGoalsRange: totalGoalsDistribution.selectedRange,
      overUnderLean,
      totalGoalsDistribution,
      meta: {
        dixonColesRho,
        lowScoreCorrectionApplied: true,
        styleGoalMultiplier: Number(calibratedStyleMultiplier.toFixed(3)),
        adjustedHomeExpectedGoals: Number(adjustedHomeExpectedGoals.toFixed(2)),
        adjustedAwayExpectedGoals: Number(adjustedAwayExpectedGoals.toFixed(2)),
      },
    };
  }

  private effectiveCalibration(input: PredictionEngineInput): CalibrationParameters {
    return {
      modelBlendWeight: input.calibration?.modelBlendWeight ?? 0.9,
      oddsBlendWeight: input.calibration?.oddsBlendWeight ?? 0.1,
      dixonColesRho: input.calibration?.dixonColesRho ?? -0.08,
      styleGoalMultiplier: input.calibration?.styleGoalMultiplier ?? 1,
      highConfidenceScoreMin: input.calibration?.highConfidenceScoreMin ?? 72,
      highConfidenceRiskMax: input.calibration?.highConfidenceRiskMax ?? 50,
      cautiousRiskThreshold: input.calibration?.cautiousRiskThreshold ?? 64,
    };
  }

  private autoWeighting(
    input: PredictionEngineInput,
    modelProbability: ProbabilityTriplet,
    warningCount: number,
  ): AutoWeightingResult {
    const odds = input.oddsSnapshot?.normalizedProbability;
    const calibration = this.effectiveCalibration(input);
    const oddsMovementRisk = this.oddsMovementRisk(input);
    const oddsReliability = !odds
      ? 'LOW'
      : oddsMovementRisk >= 5
        ? 'MEDIUM'
        : 'HIGH';
    const factorCoveragePenalty = warningCount >= 3 ? 1 : 0;
    const modelOddsGap = odds
      ? this.probabilityGap(modelProbability, odds)
      : 0;
    const modelReliability =
      warningCount <= 1 && modelOddsGap < 14
        ? 'HIGH'
        : warningCount <= 3 && modelOddsGap < 22
          ? 'MEDIUM'
          : 'LOW';
    const baseOddsWeight = odds ? calibration.oddsBlendWeight ?? 0.1 : 0;
    const oddsWeight = this.clamp(
      oddsReliability === 'HIGH'
        ? baseOddsWeight
        : oddsReliability === 'MEDIUM'
          ? baseOddsWeight * 0.65
          : 0,
      0,
      0.18,
    );
    const modelWeight = Number((1 - oddsWeight).toFixed(3));
    const cautiousRecommended =
      modelReliability === 'LOW' ||
      oddsMovementRisk >= 6 ||
      modelOddsGap >= 22 ||
      factorCoveragePenalty > 0;

    return {
      modelWeight,
      oddsWeight: Number(oddsWeight.toFixed(3)),
      oddsReliability,
      modelReliability,
      cautiousRecommended,
      reason: odds
        ? `模型与赔率差异 ${modelOddsGap.toFixed(1)} 个百分点，赔率波动风险 ${oddsMovementRisk.toFixed(1)}。`
        : '暂无赔率快照，主要使用球队强度、状态和赛前数据。',
    };
  }

  private applyAutoWeighting(
    probability: ProbabilityTriplet,
    input: PredictionEngineInput,
    autoWeighting: AutoWeightingResult,
  ): ProbabilityTriplet {
    const odds = input.oddsSnapshot?.normalizedProbability;
    if (!odds || autoWeighting.oddsWeight <= 0) {
      return probability;
    }

    return normalizeTriplet({
      homeWin:
        probability.homeWin * autoWeighting.modelWeight +
        odds.homeWin * autoWeighting.oddsWeight,
      draw:
        probability.draw * autoWeighting.modelWeight +
        odds.draw * autoWeighting.oddsWeight,
      awayWin:
        probability.awayWin * autoWeighting.modelWeight +
        odds.awayWin * autoWeighting.oddsWeight,
    });
  }

  private dixonColesAdjustment(
    homeGoals: number,
    awayGoals: number,
    homeExpectedGoals: number,
    awayExpectedGoals: number,
    rho: number,
  ) {
    let adjustment = 1;

    if (homeGoals === 0 && awayGoals === 0) {
      adjustment = 1 - homeExpectedGoals * awayExpectedGoals * rho;
    } else if (homeGoals === 0 && awayGoals === 1) {
      adjustment = 1 + homeExpectedGoals * rho;
    } else if (homeGoals === 1 && awayGoals === 0) {
      adjustment = 1 + awayExpectedGoals * rho;
    } else if (homeGoals === 1 && awayGoals === 1) {
      adjustment = 1 - rho;
    }

    return this.clamp(adjustment, 0.65, 1.35);
  }

  private styleGoalMultiplier(input: PredictionEngineInput) {
    const attackAverage =
      ((input.homeTeam.attackIndex ?? 50) + (input.awayTeam.attackIndex ?? 50)) /
      100;
    const defenseAverage =
      ((input.homeTeam.defenseIndex ?? 50) + (input.awayTeam.defenseIndex ?? 50)) /
      100;
    const tempoAverage =
      ((input.homeTeam.tempoIndex ?? 50) + (input.awayTeam.tempoIndex ?? 50)) /
      100;
    const directnessAverage =
      ((input.homeTeam.directnessIndex ?? 50) +
        (input.awayTeam.directnessIndex ?? 50)) /
      100;
    const overUnderLine = input.oddsSnapshot?.overUnder?.line;
    const oddsGoalSignal = overUnderLine
      ? overUnderLine >= 2.75
        ? 0.04
        : overUnderLine <= 2.25
          ? -0.04
          : 0
      : 0;
    const multiplier =
      1 +
      (attackAverage - 1) * 0.12 -
      (defenseAverage - 1) * 0.1 +
      (tempoAverage - 1) * 0.06 +
      (directnessAverage - 1) * 0.04 +
      oddsGoalSignal;

    return this.clamp(multiplier, 0.88, 1.16);
  }

  private probabilityGap(a: ProbabilityTriplet, b: ProbabilityTriplet) {
    return Math.max(
      Math.abs(a.homeWin - b.homeWin),
      Math.abs(a.draw - b.draw),
      Math.abs(a.awayWin - b.awayWin),
    );
  }

  private totalGoalsDistribution(
    candidates: ScoreCandidate[],
  ): TotalGoalsDistribution {
    const low = candidates
      .filter((candidate) => candidate.totalGoals <= 1)
      .reduce((sum, candidate) => sum + candidate.probability, 0);
    const medium = candidates
      .filter(
        (candidate) => candidate.totalGoals >= 2 && candidate.totalGoals <= 3,
      )
      .reduce((sum, candidate) => sum + candidate.probability, 0);
    const high = candidates
      .filter((candidate) => candidate.totalGoals >= 4)
      .reduce((sum, candidate) => sum + candidate.probability, 0);
    const selectedRange =
      low >= medium && low >= high
        ? ('0-1球' as const)
        : high >= low && high >= medium
          ? ('4球以上' as const)
          : ('2-3球' as const);

    return {
      low: Number(low.toFixed(2)),
      medium: Number(medium.toFixed(2)),
      high: Number(high.toFixed(2)),
      selectedRange,
    };
  }

  private poissonProbability(goals: number, lambda: number) {
    const safeLambda = Math.max(0.05, lambda);
    return (
      (Math.exp(-safeLambda) * safeLambda ** goals) /
      this.factorial(goals)
    );
  }

  private factorial(value: number) {
    if (value <= 1) {
      return 1;
    }

    let result = 1;
    for (let index = 2; index <= value; index += 1) {
      result *= index;
    }
    return result;
  }

  private riskBreakdown(
    probability: ProbabilityTriplet,
    available: FactorContribution[],
    warningCount: number,
    input: PredictionEngineInput,
  ): ScoreBreakdown {
    const values = [probability.homeWin, probability.draw, probability.awayWin].sort(
      (a, b) => b - a,
    );
    const lead = values[0] - values[1];
    const probabilityCloseRisk = Math.max(0, 28 - lead) * 1.45;
    const disagreementRisk = this.factorDisagreementRisk(available);
    const dataMissingRisk = Math.min(22, warningCount * 5);
    const aiUncertaintyRisk = Math.max(
      0,
      14 - (input.aiAdjustment?.confidence ?? 60) / 8,
    );
    const formVolatilityRisk = this.formVolatilityRisk(input);
    const lineupRisk = this.lineupRisk(input);
    const weatherRisk = this.clampRiskPart(input.weatherImpact ?? 0, 16);
    const travelRisk = this.travelRisk(input);
    const oddsDisagreementRisk = this.oddsDisagreementRisk(probability, input);
    const autoWeighting = this.autoWeighting(input, probability, warningCount);
    const autoWeightingRisk = autoWeighting.cautiousRecommended ? 8 : 0;

    const parts = [
      {
        key: 'probabilityClose',
        label: '概率接近度',
        value: Math.round(probabilityCloseRisk),
        reason: '第一方向与第二方向差距越小，赛果波动风险越高。',
      },
      {
        key: 'factorDisagreement',
        label: '模型因子分歧',
        value: Math.round(disagreementRisk),
        reason: 'Elo、状态、进攻防守等因子越不一致，风险越高。',
      },
      {
        key: 'dataMissing',
        label: '数据缺失',
        value: Math.round(dataMissingRisk),
        reason: '缺少关键赛前数据时，提高风险等级。',
      },
      {
        key: 'aiUncertainty',
        label: 'AI修正不确定性',
        value: Math.round(aiUncertaintyRisk),
        reason: 'AI对赛前信息修正信心不足时，提高风险。',
      },
      {
        key: 'formVolatility',
        label: '近期状态波动',
        value: Math.round(formVolatilityRisk),
        reason: '近期表现波动越大，比赛判断越需谨慎。',
      },
      {
        key: 'lineupUncertainty',
        label: '首发阵容不确定性',
        value: Math.round(lineupRisk),
        reason: '首发稳定性越低，临场波动风险越高。',
      },
      {
        key: 'weatherImpact',
        label: '天气与场地影响',
        value: Math.round(weatherRisk),
        reason: '天气、场地或城市环境影响越大，比赛节奏越不稳定。',
      },
      {
        key: 'travelFatigue',
        label: '旅行与恢复影响',
        value: Math.round(travelRisk),
        reason: '旅行距离和恢复压力越大，球队发挥波动越高。',
      },
      {
        key: 'oddsDisagreement',
        label: '赔率校准分歧',
        value: Math.round(oddsDisagreementRisk),
        reason: '模型概率与最新去水隐含概率分歧越大，风险越高。',
      },
      {
        key: 'autoWeightingCaution',
        label: '自动调权谨慎标记',
        value: Math.round(autoWeightingRisk),
        reason: '当历史校准、赔率波动和模型分歧提示不稳定时，标为谨慎参考。',
      },
    ];
    const score = Math.round(
      Math.min(95, Math.max(5, parts.reduce((sum, part) => sum + part.value, 0))),
    );

    return { score, parts };
  }

  private confidenceBreakdown(
    probability: ProbabilityTriplet,
    available: FactorContribution[],
    warningCount: number,
    riskScore: number,
    input?: PredictionEngineInput,
  ): ScoreBreakdown {
    const values = [probability.homeWin, probability.draw, probability.awayWin].sort(
      (a, b) => b - a,
    );
    const lead = values[0] - values[1];
    const coverage = Math.min(
      1,
      available.reduce((sum, factor) => sum + factor.weight, 0) / 100,
    );
    const agreement = Math.max(0, 100 - this.factorDisagreementRisk(available) * 3);
    const v2Coverage = input ? this.v2DataCoverage(input) : 0;
    const oddsAgreement = input ? this.oddsAgreementScore(probability, input) : 0;
    const autoWeighting = input
      ? this.autoWeighting(input, probability, warningCount)
      : undefined;
    const autoWeightingScore =
      autoWeighting?.modelReliability === 'HIGH'
        ? 6
        : autoWeighting?.modelReliability === 'MEDIUM'
          ? 3
          : 0;
    const parts = [
      {
        key: 'probabilityEdge',
        label: '概率领先优势',
        value: Math.round(Math.min(32, lead * 1.25)),
        reason: '第一方向领先越明显，模型信心越高。',
      },
      {
        key: 'modelAgreement',
        label: '模型一致性',
        value: Math.round(Math.min(24, agreement * 0.24)),
        reason: '多个因子方向一致时，提高信心。',
      },
      {
        key: 'dataCoverage',
        label: '数据覆盖度',
        value: Math.round(coverage * 22),
        reason: '可用因子越完整，信心越高。',
      },
      {
        key: 'preMatchCoverage',
        label: '临场变量覆盖',
        value: Math.round(v2Coverage * 12),
        reason: '伤停、首发、动机、天气和旅行信息越完整，筛选高信心场次越可靠。',
      },
      {
        key: 'oddsAgreement',
        label: '赔率校准一致性',
        value: Math.round(oddsAgreement),
        reason: '模型概率与最新去水隐含概率越一致，信心越高。',
      },
      {
        key: 'autoWeightingReliability',
        label: '历史调权可信度',
        value: Math.round(autoWeightingScore),
        reason: '历史回测和当前赔率分歧越稳定，模型信心越高。',
      },
      {
        key: 'riskPenalty',
        label: '风险扣分',
        value: -Math.round(Math.min(24, riskScore * 0.28 + warningCount * 2)),
        reason: '高风险和数据缺失会降低信心。',
      },
    ];
    const raw = 36 + parts.reduce((sum, part) => sum + part.value, 0);

    return {
      score: Math.round(Math.min(95, Math.max(15, raw))),
      parts,
    };
  }

  private factorDisagreementRisk(available: FactorContribution[]) {
    if (available.length <= 1) {
      return 18;
    }

    const directions = available.map((factor) =>
      this.recommendationDirection(factor.probability),
    );
    const counts = directions.reduce<Record<string, number>>((map, direction) => {
      map[direction] = (map[direction] ?? 0) + 1;
      return map;
    }, {});
    const maxAgreement = Math.max(...Object.values(counts));
    const disagreementRatio = 1 - maxAgreement / available.length;

    return Math.round(disagreementRatio * 32);
  }

  private formVolatilityRisk(input: PredictionEngineInput) {
    const home = input.homeTeam.recent5;
    const away = input.awayTeam.recent5;
    const homeVolatility = Math.abs(
      (home?.averageGoalsFor ?? 1.2) - (home?.averageGoalsAgainst ?? 1.2),
    );
    const awayVolatility = Math.abs(
      (away?.averageGoalsFor ?? 1.2) - (away?.averageGoalsAgainst ?? 1.2),
    );

    return Math.min(14, (homeVolatility + awayVolatility) * 4);
  }

  private applyV2PreMatchAdjustments(
    probability: ProbabilityTriplet,
    input: PredictionEngineInput,
  ) {
    const homeInjury = this.clampSigned(input.homeTeam.injuryImpact ?? 0, 20);
    const awayInjury = this.clampSigned(input.awayTeam.injuryImpact ?? 0, 20);
    const homeMotivation = this.clampScore100(input.homeTeam.motivationScore ?? 50);
    const awayMotivation = this.clampScore100(input.awayTeam.motivationScore ?? 50);
    const homeTravel = this.clampRiskPart(input.homeTeam.travelFatigue ?? 0, 20);
    const awayTravel = this.clampRiskPart(input.awayTeam.travelFatigue ?? 0, 20);
    const homeLineup = this.clampScore100(input.homeTeam.lineupStability ?? 60);
    const awayLineup = this.clampScore100(input.awayTeam.lineupStability ?? 60);

    const homeAdjustment =
      (awayInjury - homeInjury) * 0.45 +
      (homeMotivation - awayMotivation) * 0.08 +
      (awayTravel - homeTravel) * 0.12 +
      (homeLineup - awayLineup) * 0.06;
    const awayAdjustment = -homeAdjustment;
    const drawAdjustment =
      Math.abs(homeAdjustment) < 2
        ? 1.5
        : -Math.min(2.5, Math.abs(homeAdjustment) * 0.15);

    return normalizeTriplet({
      homeWin: probability.homeWin + homeAdjustment,
      draw: probability.draw + drawAdjustment,
      awayWin: probability.awayWin + awayAdjustment,
    });
  }

  private lineupRisk(input: PredictionEngineInput) {
    const home = this.clampScore100(input.homeTeam.lineupStability ?? 60);
    const away = this.clampScore100(input.awayTeam.lineupStability ?? 60);
    return Math.min(14, ((100 - home) + (100 - away)) * 0.08);
  }

  private travelRisk(input: PredictionEngineInput) {
    const home = this.clampRiskPart(input.homeTeam.travelFatigue ?? 0, 20);
    const away = this.clampRiskPart(input.awayTeam.travelFatigue ?? 0, 20);
    return Math.min(12, (home + away) * 0.28);
  }

  private oddsDisagreementRisk(
    probability: ProbabilityTriplet,
    input: PredictionEngineInput,
  ) {
    const oddsProbability = input.oddsSnapshot?.normalizedProbability;
    if (!oddsProbability) {
      return 8;
    }

    const maxDiff = Math.max(
      Math.abs(probability.homeWin - oddsProbability.homeWin),
      Math.abs(probability.draw - oddsProbability.draw),
      Math.abs(probability.awayWin - oddsProbability.awayWin),
    );
    const movementRisk = this.oddsMovementRisk(input);

    return Math.min(18, maxDiff * 0.55 + movementRisk);
  }

  private oddsAgreementScore(
    probability: ProbabilityTriplet,
    input: PredictionEngineInput,
  ) {
    const oddsProbability = input.oddsSnapshot?.normalizedProbability;
    if (!oddsProbability) {
      return 0;
    }

    const avgDiff =
      (Math.abs(probability.homeWin - oddsProbability.homeWin) +
        Math.abs(probability.draw - oddsProbability.draw) +
        Math.abs(probability.awayWin - oddsProbability.awayWin)) /
      3;

    return Math.max(0, Math.min(10, 10 - avgDiff * 0.45));
  }

  private oddsMovementRisk(input: PredictionEngineInput) {
    const movement = input.oddsSnapshot?.movement;
    if (!movement) {
      return 0;
    }

    const maxMove = Math.max(
      Math.abs(movement.homeWinDelta ?? 0),
      Math.abs(movement.drawDelta ?? 0),
      Math.abs(movement.awayWinDelta ?? 0),
    );

    return Math.min(6, maxMove * 2);
  }

  private v2DataCoverage(input: PredictionEngineInput) {
    const checks = [
      input.homeTeam.injuryImpact !== undefined,
      input.awayTeam.injuryImpact !== undefined,
      input.homeTeam.lineupStability !== undefined,
      input.awayTeam.lineupStability !== undefined,
      input.homeTeam.motivationScore !== undefined,
      input.awayTeam.motivationScore !== undefined,
      input.weatherImpact !== undefined,
      input.homeTeam.travelFatigue !== undefined,
      input.awayTeam.travelFatigue !== undefined,
    ];

    return checks.filter(Boolean).length / checks.length;
  }

  private clampSigned(value: number, maxAbs: number) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return Math.min(maxAbs, Math.max(-maxAbs, numeric));
  }

  private clampScore100(value: number) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 50;
    }

    return Math.min(100, Math.max(0, numeric));
  }

  private clampRiskPart(value: number, max: number) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return 0;
    }

    return Math.min(max, Math.max(0, numeric));
  }

  private clamp(value: number, min: number, max: number) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return min;
    }

    return Math.min(max, Math.max(min, numeric));
  }

  private confidenceLevel(score: number) {
    if (score >= 70) {
      return 'HIGH' as const;
    }

    if (score >= 50) {
      return 'MEDIUM' as const;
    }

    return 'LOW' as const;
  }

  private riskLevel(score: number) {
    if (score >= 60) {
      return 'HIGH' as const;
    }

    if (score >= 30) {
      return 'MEDIUM' as const;
    }

    return 'LOW' as const;
  }

  private clampScore(value: number) {
    return Math.min(5, Math.max(0, Math.round(value)));
  }

  private clampExpectedGoals(value: number) {
    return Math.min(3.8, Math.max(0.15, Number(value) || 1));
  }
}
