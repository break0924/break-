import { FactorInput } from '../prediction-engine.types';
import {
  edgeFromScores,
  evidenceFromEdge,
  formScore,
} from '../prediction-engine.utils';
import { BasePredictionFactor } from './base-factor';

export class RecentFiveFormFactor extends BasePredictionFactor {
  readonly key = 'recent5' as const;
  readonly label = '最近5场状态';
  readonly defaultWeight = 1.05;

  evaluate(input: FactorInput) {
    return evaluateFormFactor(this, input, 'recent5', 5);
  }
}

export class RecentTenFormFactor extends BasePredictionFactor {
  readonly key = 'recent10' as const;
  readonly label = '最近10场状态';
  readonly defaultWeight = 0.85;

  evaluate(input: FactorInput) {
    return evaluateFormFactor(this, input, 'recent10', 10);
  }
}

export class FormFactor extends BasePredictionFactor {
  readonly key = 'form' as const;
  readonly label = '近期状态';
  readonly defaultWeight = 25;

  evaluate(input: FactorInput) {
    const homeRecent5 = formScore(input.homeTeam.recent5);
    const awayRecent5 = formScore(input.awayTeam.recent5);
    const homeRecent10 = formScore(input.homeTeam.recent10);
    const awayRecent10 = formScore(input.awayTeam.recent10);

    if (
      homeRecent5 === null &&
      homeRecent10 === null &&
      awayRecent5 === null &&
      awayRecent10 === null
    ) {
      return this.unavailable(input, '缺少最近5场和最近10场状态数据，跳过 Form 因子。');
    }

    const home = weightedAverage([
      { value: homeRecent5, weight: 0.6 },
      { value: homeRecent10, weight: 0.4 },
    ]);
    const away = weightedAverage([
      { value: awayRecent5, weight: 0.6 },
      { value: awayRecent10, weight: 0.4 },
    ]);
    const edge = edgeFromScores(home / 100, away / 100);

    return this.available(
      input,
      evidenceFromEdge(edge),
      `Form 综合分：主队 ${home.toFixed(0)}，客队 ${away.toFixed(0)}；最近5场权重60%，最近10场权重40%。`,
    );
  }
}

function evaluateFormFactor(
  factor: BasePredictionFactor,
  input: FactorInput,
  key: 'recent5' | 'recent10',
  sampleSize: number,
) {
  const home = formScore(input.homeTeam[key]);
  const away = formScore(input.awayTeam[key]);

  if (home === null || away === null) {
    return factor['unavailable'](
      input,
      `缺少最近${sampleSize}场完整战绩，跳过该因子。`,
    );
  }

  const edge = edgeFromScores(home / 100, away / 100);
  return factor['available'](
    input,
    evidenceFromEdge(edge),
    `最近${sampleSize}场 formScore：主队 ${home.toFixed(0)}，客队 ${away.toFixed(0)}。`,
  );
}

function weightedAverage(items: Array<{ value: number | null; weight: number }>) {
  const available = items.filter(
    (item): item is { value: number; weight: number } => item.value !== null,
  );

  if (available.length === 0) {
    return 50;
  }

  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  return (
    available.reduce((sum, item) => sum + item.value * item.weight, 0) /
    totalWeight
  );
}
