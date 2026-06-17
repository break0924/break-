import { request } from './http';
import { callCloudFunction, isCloudbaseEnabled } from '../utils/cloudbase';
import {
  DEMO_CHALLENGE_HOME,
  DEMO_INVITE_STATUS,
  DEMO_LEADERBOARD,
  DEMO_MEMBERSHIP_PLANS,
  DEMO_MEMBERSHIP_STATUS,
  DEMO_MY_CHALLENGE_SCORE,
  DEMO_PREDICTION_STATS,
  DEMO_TEAMS,
  demoMatches,
  demoPredictionArchive,
  demoPredictionToday,
  demoUpcomingMatches,
  demoUpcomingRecommendation,
  demoUpcomingPredictionToday,
} from '../mock/worldCupDemoData';
import type {
  AiReport,
  AdminGeneratePredictionsResult,
  AdminInviteStats,
  AdminPublishPredictionsResult,
  AdminSyncMatchResult,
  ChallengeHome,
  CloudHomeData,
  DailyRecommendation,
  InviteStatus,
  LeaderboardItem,
  LoginResponse,
  Match,
  MatchFilterOptions,
  MatchListQuery,
  MembershipPlan,
  MembershipOrderStatus,
  MembershipPaymentOrder,
  MembershipStatus,
  MyChallengeScore,
  PredictionArchiveResponse,
  MissingPredictionCheckResult,
  PredictionArchive,
  PredictionStats,
  Team,
  UserProfile,
} from './types';

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== ''),
  );
}

export const api = {
  homeData(date?: string) {
    if (isCloudbaseEnabled()) {
      return callCloudFunction<CloudHomeData>('homeData', compact({ date })).catch(() => {
        const today = date ? demoPredictionToday(date) : demoUpcomingPredictionToday(4);
        const matches = date ? demoMatches({ date: today.date }) : demoUpcomingMatches(4);
        return {
          date: today.date || date || '',
          isMember: DEMO_MEMBERSHIP_STATUS.isMember,
          predictions: today.predictions,
          matches,
          stats: DEMO_PREDICTION_STATS,
          membership: DEMO_MEMBERSHIP_STATUS,
          invite: DEMO_INVITE_STATUS,
        };
      });
    }

    return Promise.all([
      date ? api.predictionToday(date) : Promise.resolve(demoUpcomingPredictionToday(4)),
      date ? api.matches({ date }) : Promise.resolve(demoUpcomingMatches(4)),
      api.predictionStats(),
      api.membershipStatus(),
      api.inviteStatus(),
    ]).then(([today, matches, stats, membership, invite]) => ({
      date: today.date || date || '',
      isMember: membership.isMember,
      predictions: today.predictions || [],
      matches,
      stats,
      membership,
      invite,
    }));
  },
  login(payload: {
    openId: string;
    nickname?: string;
    avatarUrl?: string;
  }) {
    return request<LoginResponse>({
      url: '/auth/wechat-login',
      method: 'POST',
      data: payload,
    });
  },
  me() {
    return request<UserProfile>({ url: '/me', method: 'GET' });
  },
  matches(params?: MatchListQuery) {
    if (isCloudbaseEnabled()) {
      return callCloudFunction<Match[]>('matches', {
        action: 'list',
        params: params || {},
      }).catch(() => demoMatches(params));
    }

    const query = new URLSearchParams();
    if (params?.date) {
      query.set('date', params.date);
    }
    if (params?.groupName) {
      query.set('groupName', params.groupName);
    }
    if (params?.stage) {
      query.set('stage', params.stage);
    }
    if (params?.status) {
      query.set('status', params.status);
    }

    return request<Match[]>({
      url: `/matches${query.toString() ? `?${query.toString()}` : ''}`,
      method: 'GET',
    }).catch(() => demoMatches(params));
  },
  matchFilters() {
    return request<MatchFilterOptions>({
      url: '/matches/filters',
      method: 'GET',
    }).catch(() => ({
      dates: Array.from(new Set(demoMatches().map((item) => item.matchDate || ''))).filter(Boolean),
      groups: Array.from(new Set(demoMatches().map((item) => item.groupName || ''))).filter(Boolean),
      stages: ['GROUP'],
    }));
  },
  teams() {
    return request<Team[]>({ url: '/teams', method: 'GET' }).catch(() => DEMO_TEAMS);
  },
  matchDetail(id: string) {
    return request<Match>({ url: `/matches/${id}`, method: 'GET' }).catch(() => {
      const match = demoMatches().find((item) => item.id === id);
      if (!match) throw new Error('比赛不存在');
      return match;
    });
  },
  aiReport(matchId: string) {
    return request<AiReport>({
      url: `/matches/${matchId}/ai-report`,
      method: 'GET',
    });
  },
  todayRecommendation() {
    return request<DailyRecommendation>({
      url: '/recommendations/today',
      method: 'GET',
    }).catch(() => demoUpcomingRecommendation(4));
  },
  membershipStatus() {
    if (isCloudbaseEnabled()) {
      return callCloudFunction<MembershipStatus>('member', {
        action: 'status',
      }).catch(() => DEMO_MEMBERSHIP_STATUS);
    }

    return request<MembershipStatus>({
      url: '/membership/status',
      method: 'GET',
    }).catch(() => DEMO_MEMBERSHIP_STATUS);
  },
  membershipPlans() {
    return request<MembershipPlan[]>({
      url: '/membership/plans',
      method: 'GET',
    }).catch(() => DEMO_MEMBERSHIP_PLANS);
  },
  createMembershipOrder(planId: string) {
    return request<MembershipPaymentOrder>({
      url: '/membership/orders',
      method: 'POST',
      data: { planId },
    });
  },
  membershipOrderStatus(orderId: string) {
    return request<MembershipOrderStatus>({
      url: `/membership/orders/${orderId}/status`,
      method: 'GET',
    });
  },
  challengeHome() {
    return request<ChallengeHome>({ url: '/challenge', method: 'GET' }).catch(() => DEMO_CHALLENGE_HOME);
  },
  myChallengeScore(seasonId?: string) {
    return request<MyChallengeScore>({
      url: `/challenge/my-score${seasonId ? `?seasonId=${seasonId}` : ''}`,
      method: 'GET',
    }).catch(() => DEMO_MY_CHALLENGE_SCORE);
  },
  submitMatchPrediction(data: {
    matchId: string;
    direction: 'HOME_WIN' | 'DRAW' | 'AWAY_WIN';
    predictedHome?: number;
    predictedAway?: number;
  }) {
    return request({
      url: '/challenge/match-predictions',
      method: 'POST',
      data,
    });
  },
  submitTournamentPick(data: {
    seasonId: string;
    championTeamId?: string;
    finalFourTeamIds: string[];
    goldenBootName?: string;
  }) {
    return request({
      url: '/challenge/tournament-pick',
      method: 'POST',
      data,
    });
  },
  leaderboard(seasonId?: string) {
    return request<LeaderboardItem[]>({
      url: `/challenge/leaderboard${seasonId ? `?seasonId=${seasonId}` : ''}`,
      method: 'GET',
    }).catch(() => DEMO_LEADERBOARD);
  },
  predictionToday(date?: string) {
    if (isCloudbaseEnabled()) {
      return callCloudFunction<PredictionArchiveResponse>('predictions', compact({
        action: 'today',
        date,
      })).catch(() => (date ? demoPredictionToday(date) : demoUpcomingPredictionToday(4)));
    }

    return request<PredictionArchiveResponse>({
      url: `/predictions/today${date ? `?date=${encodeURIComponent(date)}` : ''}`,
      method: 'GET',
    }).catch(() => (date ? demoPredictionToday(date) : demoUpcomingPredictionToday(4)));
  },
  matchPrediction(matchId: string) {
    return request<PredictionArchive>({
      url: `/predictions/by-match/${matchId}`,
      method: 'GET',
    }).catch(() => {
      const prediction = demoPredictionArchive().predictions.find((item) => item.matchId === matchId);
      if (!prediction) throw new Error('AI预测生成中');
      return prediction;
    });
  },
  predictionArchive(params?: { date?: string; hit?: 'hit' | 'miss' | 'pending' }) {
    const query = new URLSearchParams();
    if (params?.date) {
      query.set('date', params.date);
    }
    if (params?.hit) {
      query.set('hit', params.hit);
    }

    return request<PredictionArchiveResponse>({
      url: `/predictions/archive${query.toString() ? `?${query.toString()}` : ''}`,
      method: 'GET',
    }).catch(() => demoPredictionArchive(params));
  },
  predictionStats() {
    if (isCloudbaseEnabled()) {
      return callCloudFunction<PredictionStats>('predictions', {
        action: 'stats',
      }).catch(() => DEMO_PREDICTION_STATS);
    }

    return request<PredictionStats>({
      url: '/predictions/stats',
      method: 'GET',
    }).catch(() => DEMO_PREDICTION_STATS);
  },
  inviteStatus(): Promise<InviteStatus> {
    if (isCloudbaseEnabled()) {
      return callCloudFunction<InviteStatus>('invite', {
        action: 'status',
      }).catch(() => DEMO_INVITE_STATUS);
    }

    return Promise.resolve(DEMO_INVITE_STATUS);
  },
  checkMissingPrediction(matchId: string) {
    return request<MissingPredictionCheckResult>({
      url: '/admin/predictions/check-missing',
      method: 'POST',
      data: { matchId },
    });
  },
  adminGeneratePredictionsByDate(date: string, adminToken?: string) {
    return callCloudFunction<AdminGeneratePredictionsResult>('admin', compact({
      action: 'generatePredictionsByDate',
      date,
      adminToken,
    }));
  },
  adminPublishPredictionsByDate(date: string, adminToken?: string) {
    return callCloudFunction<AdminPublishPredictionsResult>('admin', compact({
      action: 'publishPredictionsByDate',
      date,
      adminToken,
    }));
  },
  adminSyncMatchResult(data: {
    matchId: string;
    homeScore: number;
    awayScore: number;
    status?: string;
    adminToken?: string;
  }) {
    return callCloudFunction<AdminSyncMatchResult>('admin', {
      action: 'syncMatchResult',
      ...data,
    });
  },
  adminInviteStats(adminToken?: string) {
    return callCloudFunction<AdminInviteStats>('admin', compact({
      action: 'inviteStats',
      adminToken,
    }));
  },
};
