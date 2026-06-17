import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PredictionDirection } from '@prisma/client';
import OpenAI from 'openai';
import {
  AI_PROMPT_VERSION,
  buildComplianceSystemPrompt,
  buildDailyRecommendationPrompt,
  buildMatchReportPrompt,
} from './ai.prompts';
import { AiContentPolicyService } from './ai-content-policy.service';
import {
  AiDailyPickResult,
  AiMatchContext,
  AiReportResult,
} from './ai.types';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client?: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly contentPolicyService: AiContentPolicyService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    const mockMode = this.configService.get<string>('AI_MOCK_MODE') === 'true';

    if (apiKey && !mockMode) {
      this.client = new OpenAI({ apiKey });
    }
  }

  get promptVersion() {
    return AI_PROMPT_VERSION;
  }

  get model() {
    return this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
  }

  async generateMatchReport(match: AiMatchContext): Promise<AiReportResult> {
    if (!this.client) {
      return this.contentPolicyService.applyReportPolicy(this.mockReport(match));
    }

    const data = await this.generateJson<AiReportResult>(
      buildMatchReportPrompt(match),
    );

    return this.contentPolicyService.applyReportPolicy(this.normalizeReport(data));
  }

  async generateDailyPicks(
    matches: AiMatchContext[],
  ): Promise<AiDailyPickResult[]> {
    if (!this.client) {
      return matches
        .slice(0, 3)
        .map((match) =>
          this.contentPolicyService.applyDailyPickPolicy(this.mockDailyPick(match)),
        );
    }

    const data = await this.generateJson<{ picks: AiDailyPickResult[] }>(
      buildDailyRecommendationPrompt(matches),
    );

    return data.picks
      .slice(0, 3)
      .map((pick) =>
        this.contentPolicyService.applyDailyPickPolicy({
          ...this.normalizeReport(pick),
          matchId: pick.matchId,
          recommendationDirection: this.normalizeDirection(
            pick.recommendationDirection,
          ),
          freeReason: pick.freeReason,
          memberReason: pick.memberReason,
        }),
      );
  }

  private async generateJson<T>(userPayload: unknown): Promise<T> {
    const response = await this.client!.chat.completions.create({
      model: this.model,
      temperature: 0.4,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: buildComplianceSystemPrompt() },
        { role: 'user', content: JSON.stringify(userPayload) },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('OpenAI returned empty content');
    }

    try {
      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.error('Failed to parse AI JSON response', error);
      throw error;
    }
  }

  private normalizeReport<T extends AiReportResult>(report: T): T {
    const homeWinProb = this.clamp(report.homeWinProb ?? 34, 0, 100);
    const drawProb = this.clamp(report.drawProb ?? 32, 0, 100);
    const awayWinProb = this.clamp(report.awayWinProb ?? 34, 0, 100);
    const predictedHome = this.safeGoal(report.predictedHome, 1);
    const predictedAway = this.safeGoal(report.predictedAway, 1);
    const aiAdjustment = report.aiAdjustment
      ? {
          homeWinDelta: this.clamp(report.aiAdjustment.homeWinDelta ?? 0, -5, 5),
          drawDelta: this.clamp(report.aiAdjustment.drawDelta ?? 0, -5, 5),
          awayWinDelta: this.clamp(report.aiAdjustment.awayWinDelta ?? 0, -5, 5),
          confidence: Math.round(
            this.clamp(report.aiAdjustment.confidence ?? 60, 1, 100),
          ),
          reason:
            report.aiAdjustment.reason ||
            'AI仅根据赛前信息给出轻微修正建议，最终结论由预测引擎计算。',
        }
      : {
          homeWinDelta: 0,
          drawDelta: 0,
          awayWinDelta: 0,
          confidence: 50,
          reason: 'AI未提供明确修正，预测引擎按基础模型计算。',
        };

    return {
      ...report,
      homeWinProb,
      drawProb,
      awayWinProb,
      predictedHome,
      predictedAway,
      riskIndex: Math.round(this.clamp(report.riskIndex ?? 50, 1, 100)),
      confidenceIndex: Math.round(this.clamp(report.confidenceIndex ?? 50, 1, 100)),
      aiAdjustment,
    };
  }

  private mockReport(match: AiMatchContext): AiReportResult {
    return {
      summary: `${match.homeTeam.name}与${match.awayTeam.name}整体实力接近，本场更适合关注中低比分走势。`,
      fullContent: [
        `双方状态：${match.homeTeam.name}和${match.awayTeam.name}都具备世界杯正赛竞争力，临场发挥、体能和首发安排会显著影响结果。`,
        '历史交锋：在缺少实时外部数据时，本报告以球队基础实力、比赛阶段和赛程压力做保守估计。',
        '关键球员：重点关注中前场核心的推进效率、定位球质量以及防线对快速反击的处理。',
        '伤停影响：若赛前出现关键球员缺阵，胜平负概率需要下调信心指数并提高风险指数。',
        '战术分析：预计双方都会先控制失误，比赛节奏可能从谨慎试探逐步转向边路和定位球机会。',
        '推荐比分：1-1。风险提示：足球比赛受临场状态影响较大，本内容仅供足球分析参考，不构成任何交易或购买建议。',
      ].join('\n\n'),
      homeWinProb: 35,
      drawProb: 31,
      awayWinProb: 34,
      predictedHome: 1,
      predictedAway: 1,
      riskIndex: 58,
      confidenceIndex: 54,
      aiAdjustment: {
        homeWinDelta: 0,
        drawDelta: 1,
        awayWinDelta: 0,
        confidence: 52,
        reason: '缺少实时阵容数据，AI仅对平局方向做轻微修正建议。',
      },
    };
  }

  private mockDailyPick(match: AiMatchContext): AiDailyPickResult {
    const report = this.mockReport(match);

    return {
      ...report,
      matchId: match.id,
      recommendationDirection: PredictionDirection.DRAW,
      freeReason: '双方实力接近，节奏可能偏谨慎，平局方向值得关注。',
      memberReason:
        '从比赛阶段、赛程压力和攻防稳定性看，双方都不适合过早压上。本场更可能由定位球或转换进攻制造机会，比分预估1-1。风险提示：早段进球、临场伤停和红黄牌都可能改变比赛节奏。',
    };
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  private safeGoal(value: number | undefined, fallback: number) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }

    return Math.max(0, Math.round(numeric));
  }

  private normalizeDirection(direction: PredictionDirection) {
    if (Object.values(PredictionDirection).includes(direction)) {
      return direction;
    }

    return PredictionDirection.DRAW;
  }
}
