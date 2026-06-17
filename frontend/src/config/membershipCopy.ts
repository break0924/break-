export type MembershipPlanKind = 'pass' | 'week';
export type MembershipResultStatus = 'success' | 'failed' | 'cancelled';

export type MembershipSuccessCopy = {
  title: string;
  subtitle: string;
  statusRows: Array<{
    label: string;
    value: string;
  }>;
  benefits: Array<{
    label: string;
    value: string;
  }>;
  primaryButton: string;
  secondaryButton: string;
};

export const membershipSuccessCopy: Record<MembershipPlanKind, MembershipSuccessCopy> = {
  pass: {
    title: '世界杯通行证开通成功',
    subtitle: '世界杯期间完整内容现已解锁，推荐你先查看今日全部比赛分析',
    statusRows: [
      { label: '已开通', value: '世界杯通行证' },
      { label: '有效期', value: '整届世界杯赛事周期' },
      { label: '当前状态', value: '已生效' },
    ],
    benefits: [
      { label: '今日全部比赛预测', value: '已解锁' },
      { label: '完整推荐理由', value: '已解锁' },
      { label: '历史命中率详情', value: '已解锁' },
      { label: '高级榜单', value: '已解锁' },
    ],
    primaryButton: '查看今日完整预测',
    secondaryButton: '进入挑战赛',
  },
  week: {
    title: '体验周卡开通成功',
    subtitle: '未来7天内的完整比赛预测与推荐理由已解锁',
    statusRows: [
      { label: '已开通', value: '体验周卡' },
      { label: '有效期', value: '7天' },
      { label: '当前状态', value: '已生效' },
    ],
    benefits: [
      { label: '本周全部比赛预测', value: '已解锁' },
      { label: '完整推荐理由', value: '已解锁' },
      { label: '风险提示', value: '已解锁' },
      { label: '更多比分参考', value: '已解锁' },
    ],
    primaryButton: '去看本周完整分析',
    secondaryButton: '升级为世界杯通行证',
  },
};

export const membershipFailureCopy = {
  failed: {
    title: '支付未完成',
    subtitle: '暂未成功开通会员，你可以稍后重试',
    primaryButton: '重新支付',
    secondaryButton: '返回会员页',
  },
  cancelled: {
    title: '你已取消支付',
    subtitle: '当前仍可查看免费内容，完整内容可随时重新开通',
    primaryButton: '继续免费浏览',
    secondaryButton: '重新开通会员',
  },
} as const;

export const membershipArrivalTips = {
  short: [
    '世界杯通行证已生效',
    '会员权益已到账，可查看完整内容',
    '已解锁当天全部比赛预测与完整推荐理由',
    '会员已开通，快去查看今日完整分析',
  ],
  home: [
    '世界杯通行证已生效，今日全部比赛预测已解锁',
    '会员权益已到账，快去查看今日完整分析',
    '你已解锁完整 AI 报告、每日推荐与高级榜单',
  ],
  today: [
    '你已开通世界杯通行证，今日全部比赛分析现已解锁',
    '可查看完整推荐理由、风险提示与更多比分参考',
  ],
  me: {
    title: '高级会员',
    subtitle: '世界杯通行证已生效，可查看完整内容与挑战高级权益',
  },
};
