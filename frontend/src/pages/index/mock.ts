import { DEMO_INVITE_STATUS, demoHomePredictions } from '../../mock/worldCupDemoData';

export type PredictionMock = {
  id: string;
  matchId?: string;
  kickoffTime: string;
  groupName: string;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
  predictedScore: string;
  scoreCandidates?: Array<{
    home: number;
    away: number;
    text: string;
    probability: number;
    totalGoals: number;
    rank: number;
  }>;
  totalGoalsRange?: string | null;
  overUnderLean?: string | null;
  direction: string;
  confidence: string;
  risk: string;
  summary?: string;
  archiveLabel?: string;
  probabilities?: {
    home: number;
    draw: number;
    away: number;
  };
};

export type ScheduleMock = {
  id: string;
  kickoffTime: string;
  groupName: string;
  homeTeam: string;
  homeFlag: string;
  awayTeam: string;
  awayFlag: string;
};

export type StatMock = {
  label: string;
  value: string;
  hint: string;
};

export type BenefitMock = {
  title: string;
  desc: string;
  icon: string;
};

export type InviteMock = {
  code: string;
  invitedCount: number;
  paidInvitedCount: number;
  rewards: string[];
};

export const predictions: PredictionMock[] = demoHomePredictions();

export const schedules: ScheduleMock[] = predictions.map((item) => ({
  id: `s-${item.id}`,
  kickoffTime: item.kickoffTime,
  groupName: item.groupName,
  homeTeam: item.homeTeam,
  homeFlag: item.homeFlag,
  awayTeam: item.awayTeam,
  awayFlag: item.awayFlag,
}));

export const stats: StatMock[] = [
  {
    label: '胜平负命中率',
    value: '68%',
    hint: '近30场公开预测',
  },
  {
    label: '比分命中率',
    value: '22%',
    hint: '精确比分追踪',
  },
  {
    label: '总预测场次',
    value: '156',
    hint: '累计归档记录',
  },
];

export const benefits: BenefitMock[] = [
  {
    title: '解锁今日全部场次',
    desc: '当天比赛预测完整打开，不只停留在1场摘要',
    icon: '/static/icons/daily-pick.svg',
  },
  {
    title: '阵容、状态、风险一页看懂',
    desc: '把赛前关键因素、风险等级和比分参考集中看完',
    icon: '/static/icons/ai-report.svg',
  },
  {
    title: '公开归档，持续追踪',
    desc: '保留发布时间，赛后持续追踪分析表现',
    icon: '/static/icons/hit-rate.svg',
  },
  {
    title: '会员专属榜单和荣誉',
    desc: '查看更多挑战赛排名、称号与荣誉展示',
    icon: '/static/icons/ranking.svg',
  },
];

export const invite: InviteMock = {
  code: DEMO_INVITE_STATUS.inviteCode,
  invitedCount: DEMO_INVITE_STATUS.invitedCount,
  paidInvitedCount: DEMO_INVITE_STATUS.invitedPaidCount,
  rewards: [
    '邀请1人注册：送1天会员体验',
    '邀请3人注册：送3天会员体验',
    '邀请1个付费用户：送7天会员体验',
  ],
};
