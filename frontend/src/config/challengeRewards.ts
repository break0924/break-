export type ChallengeRewardTier = {
  rankStart: number;
  rankEnd: number;
  rankLabel: string;
  title: string;
  rewards: string[];
  badge: string;
  highlightColor: string;
};

export type LeaderboardRewardStatus = {
  qualified: boolean;
  tier: ChallengeRewardTier | null;
  rank: number | null;
  message: string;
};

export const rewardConfig: ChallengeRewardTier[] = [
  {
    rankStart: 1,
    rankEnd: 1,
    rankLabel: '第1名',
    title: '世界杯冠军预言家',
    badge: '冠军席位',
    highlightColor: '#ffd36f',
    rewards: [
      '6个月高级会员',
      '世界杯主题球衣1件',
      '专属冠军荣誉海报',
      '首页冠军展示7天',
      '冠军电子荣誉证书',
    ],
  },
  {
    rankStart: 2,
    rankEnd: 2,
    rankLabel: '第2名',
    title: '世界杯战术大师',
    badge: '亚军席位',
    highlightColor: '#cfe0ff',
    rewards: [
      '3个月高级会员',
      '足球主题周边礼盒1份',
      '专属亚军荣誉海报',
      '亚军电子荣誉证书',
    ],
  },
  {
    rankStart: 3,
    rankEnd: 3,
    rankLabel: '第3名',
    title: '世界杯情报官',
    badge: '季军席位',
    highlightColor: '#ffcfaa',
    rewards: [
      '3个月高级会员',
      '世界杯定制纪念礼品1份',
      '专属季军荣誉海报',
      '季军电子荣誉证书',
    ],
  },
  {
    rankStart: 4,
    rankEnd: 5,
    rankLabel: '第4-5名',
    title: 'Top 5 精英挑战者',
    badge: '精英席位',
    highlightColor: '#8db7ff',
    rewards: [
      '2个月高级会员',
      '专属挑战徽章',
      'Top 5 荣誉展示',
    ],
  },
  {
    rankStart: 6,
    rankEnd: 10,
    rankLabel: '第6-10名',
    title: 'Top 10 荣誉挑战者',
    badge: '荣誉席位',
    highlightColor: '#99f6c8',
    rewards: [
      '1个月高级会员',
      '专属排行榜荣誉标识',
      'Top 10 电子荣誉证书',
    ],
  },
];

export const challengeRules = [
  '世界杯挑战赛以最终积分榜排名为准',
  '奖励对象为活动结束时积分榜前10名用户',
  '同分时，比分命中次数更多者优先',
  '比分命中次数相同时，胜平负命中次数更多者优先',
  '仍相同时，提交时间更早者优先',
  '如发现异常账号、刷号、作弊或违规行为，将取消活动资格',
  '奖励结果将在世界杯结束后公示',
  '虚拟奖励在结果确认后自动到账',
  '实物奖励在收集收件信息后统一发放',
  '本活动仅展示虚拟积分、荣誉称号与礼物奖励，不设现金奖励',
];

export function getRewardTierByRank(rank?: number | null) {
  if (!rank) {
    return null;
  }
  return rewardConfig.find((tier) => rank >= tier.rankStart && rank <= tier.rankEnd) || null;
}

export function getLeaderboardRewardStatus(rank?: number | null): LeaderboardRewardStatus {
  const tier = getRewardTierByRank(rank);
  if (!rank) {
    return {
      qualified: false,
      tier: null,
      rank: null,
      message: '暂无排名，完成挑战后可查看奖励档位',
    };
  }
  if (!tier) {
    return {
      qualified: false,
      tier: null,
      rank,
      message: '继续提升积分，冲击前10名荣誉奖励',
    };
  }
  return {
    qualified: true,
    tier,
    rank,
    message: `当前位于${tier.rankLabel}奖励范围，可竞争「${tier.title}」`,
  };
}
