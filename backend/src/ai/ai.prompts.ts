import { AiMatchContext } from './ai.types';

export const AI_PROMPT_VERSION = 'worldcup-mvp-v2';

export function buildComplianceSystemPrompt() {
  return [
    '你是“AI世界杯预测官”的足球数据分析助手。',
    '只提供足球数据分析、赛前预测、风险提示和会员内容解锁文案。',
    '不得提供资金账户、交易撮合、票据处理、收益返还、代理履约或推广收益相关内容。',
    '不得使用确定性结果承诺类表达。',
    '必须明确预测存在不确定性，结果仅供足球内容分析参考。',
    '输出必须是合法 JSON，不要使用 Markdown。',
  ].join('\n');
}

export function buildMatchReportPrompt(match: AiMatchContext) {
  return {
    task: '生成单场世界杯赛前AI分析报告。注意：最终胜平负概率、推荐方向、参考比分、风险等级和信心等级由后端预测引擎计算，你只负责赛前信息解读和小幅AI修正建议。',
    matchFields: {
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      groupName: match.groupName,
      stage: match.stage,
      matchDate: match.matchDate,
      kickoffTime: match.kickoffTime,
      timezone: match.timezone,
      kickoffAt: match.kickoffAt,
      venue: match.venue,
      city: match.city,
      roundName: match.roundName,
      historyContext: match.historyContext,
    },
    requiredJsonShape: {
      summary: '100字以内简版摘要',
      fullContent:
        '完整中文报告，包含双方状态、球队专属标签、历史交锋、关键球员、伤停影响、战术分析、比分候选说明和风险提示；不要给出确定性结论',
      riskDisclaimer: '一句风险提示，强调不确定性和仅供足球数据分析参考',
      aiAdjustment: {
        homeWinDelta: '-5到5之间数字，表示基于阵容/新闻/战术信息对主胜概率的轻微修正建议',
        drawDelta: '-5到5之间数字，表示对平局概率的轻微修正建议',
        awayWinDelta: '-5到5之间数字，表示对客胜概率的轻微修正建议',
        confidence: '1-100整数，表示你对这次修正建议的信心，不是最终预测信心',
        reason: '80字以内说明为什么给出这个小幅修正',
      },
    },
    constraints: [
      '不要输出最终胜平负概率、最终推荐方向或最终比分；这些由预测引擎计算。',
      'aiAdjustment 只是轻微修正建议，homeWinDelta、drawDelta、awayWinDelta 都必须在 -5 到 5 之间。',
      'fullContent 必须包含“风险提示：”段落，并突出不确定性。',
      '必须为主队和客队各提炼1到2个球队专属标签，例如阵容厚度、边路推进、反击效率、定位球威胁、低位防守、身体对抗、中场控制。',
      '必须回答本场强队优势主要来自哪里、弱队最可能制造麻烦的方式、比赛节奏倾向、当前方向原因、比分区间原因和本场专属风险。',
      '不要连续复用“整体强度更好”“推进更稳定”“建议结合临场状态”等通用套话；每段都要绑定当前两支球队的具体标签或变量。',
      '必须结合 matchFields 中的球队、小组、比赛时间和 historyContext 历史资料字段。',
      '不要引导任何非内容服务购买或交易行为。',
    ],
  };
}

export function buildDailyRecommendationPrompt(matches: AiMatchContext[]) {
  return {
    task: '从候选比赛中选择3场作为AI每日推荐',
    candidateFields:
      '每个候选包含球队、小组、阶段、比赛时间、场馆和 historyContext 历史资料字段；生成时必须结合这些字段。',
    requiredJsonShape: {
      picks: [
        {
          matchId: '候选比赛id',
          recommendationDirection: 'HOME_WIN | DRAW | AWAY_WIN',
          summary: '80字以内摘要',
          fullContent: '完整推荐分析',
          homeWinProb: '0-100数字',
          drawProb: '0-100数字',
          awayWinProb: '0-100数字',
          predictedHome: '主队预测进球，非负整数',
          predictedAway: '客队预测进球，非负整数',
          riskIndex: '1-100整数',
          confidenceIndex: '1-100整数',
          freeReason: '免费用户可见的简版理由，80字以内',
          memberReason: '会员可见的完整推荐理由，必须包含“风险提示：”',
        },
      ],
    },
    candidates: matches,
    constraints: [
      '必须正好选择3场；候选不足3场时返回全部候选。',
      '每日推荐仍需返回结构化字段供旧版展示使用，但不得使用确定性表达。',
      '必须结合候选比赛中的球队、小组、比赛时间和 historyContext 历史资料字段。',
      '不得出现非内容服务交易、结果收益或确定性承诺类内容。',
      'freeReason 与 memberReason 都必须包含风险提示或不确定性提醒。',
      '每日推荐是内容分析，不是交易指令。',
    ],
  };
}
