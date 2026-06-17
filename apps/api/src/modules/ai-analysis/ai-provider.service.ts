import { Injectable } from '@nestjs/common';

@Injectable()
export class AiProviderService {
  async analyzeMatch(matchName: string) {
    return {
      title: `${matchName} 赛前信息分析`,
      summary:
        '当前为 mock AI 分析结果。正式接入模型时，应基于赛程、球队、伤停和赔率快照生成，并经过后台人工审核后发布。',
      tacticalNotes: '建议关注双方阵型、近期赛程密度和关键球员状态。',
      injuryNotes: '伤停信息需要后台录入或接入可信数据源后更新。',
      riskLevel: 'MEDIUM' as const,
      confidence: '0.6000'
    };
  }
}
