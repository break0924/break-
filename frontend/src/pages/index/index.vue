<template>
  <view class="home-page">
    <view class="home-bg">
      <view class="stadium-light light-left" />
      <view class="stadium-light light-right" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
      <view class="particle particle-a" />
      <view class="particle particle-b" />
      <view class="particle particle-c" />
    </view>

    <view class="home-shell">
      <view class="top-nav">
        <view>
          <view class="app-name">AI世界杯预测官</view>
          <view class="app-sub">World Cup AI Intelligence</view>
        </view>
        <view class="nav-actions">
          <view class="nav-chat" @tap="chatVisible = true">球迷聊</view>
          <view class="nav-member" @tap="go('/pages/membership/index')">会员</view>
        </view>
      </view>

      <HomeBanner
        title="2026世界杯 AI每日预测"
        :subtitle="homePredictionSubtitle"
        :status="homeStatusText"
        :tags="homeTags"
        @primary="go('/pages/today/index')"
        @member="go('/pages/membership/index')"
      />

      <section class="home-section hero-section">
        <view class="section-heading">
          <view>
            <view class="section-title">接下来 AI 预测</view>
            <view class="section-desc">
              {{ predictionSectionDesc }}
            </view>
          </view>
          <view class="section-chip">重点更新</view>
        </view>
        <view class="access-note">
          {{ accessNoteText }}
        </view>
        <view class="prediction-showcase">
          <PredictionCard
            v-if="primaryPrediction"
            :prediction="primaryPrediction"
            featured
            @detail="openPredictionDetail(primaryPrediction)"
          />
          <view class="prediction-list">
            <PredictionCard
              v-for="item in secondaryPredictions"
              :key="item.id"
              :prediction="item"
              :locked="!isMember"
              :unlock-count="secondaryPredictions.length"
              @detail="openPredictionDetail(item)"
              @unlock="go('/pages/membership/index')"
            />
          </view>
        </view>
      </section>

      <section class="home-section">
        <view class="section-heading">
          <view>
            <view class="section-title">近期赛程</view>
            <view class="section-desc">北京时间 · 最近开赛对阵</view>
          </view>
          <view class="section-link" @tap="go('/pages/schedule/index')">全部赛程</view>
        </view>
        <view class="schedule-list">
          <ScheduleCard
            v-for="item in schedules"
            :key="item.id"
            :schedule="item"
          />
        </view>
      </section>

      <section class="home-section">
        <view class="section-heading">
          <view>
            <view class="section-title">历史命中率</view>
            <view class="section-desc">所有预测公开归档，持续追踪命中表现</view>
          </view>
          <view class="section-link" @tap="go('/pages/archive/index')">查看历史记录</view>
        </view>
        <view class="stats-grid">
          <StatsCard
            v-for="item in stats"
            :key="item.label"
            :stat="item"
          />
        </view>
      </section>

      <ChallengeBanner @join="go('/pages/challenge/index')" />

      <section class="home-section benefits-section">
        <view class="section-heading">
          <view>
            <view class="section-title">会员权益</view>
            <view class="section-desc">解锁更完整的 AI 足球分析内容</view>
          </view>
        </view>
        <MembershipBenefits :benefits="benefits" />
      </section>

      <InviteFriendsCard :invite="invite" />

      <view class="risk-note">
        AI分析仅供足球数据参考，不承诺结果；挑战赛仅计算虚拟积分与称号。
      </view>
    </view>

    <FanChatDrawer :visible="chatVisible" @close="chatVisible = false" />
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type { CloudHomeData, Match, PredictionArchive, PredictionArchiveResponse } from '../../api/types';
import ChallengeBanner from './components/ChallengeBanner.vue';
import FanChatDrawer from './components/FanChatDrawer.vue';
import HomeBanner from './components/HomeBanner.vue';
import InviteFriendsCard from './components/InviteFriendsCard.vue';
import MembershipBenefits from './components/MembershipBenefits.vue';
import PredictionCard from './components/PredictionCard.vue';
import ScheduleCard from './components/ScheduleCard.vue';
import StatsCard from './components/StatsCard.vue';
import { getTeamFlag } from '../../utils/assets';
import { isActiveMatchLike, sortByKickoff } from '../../utils/activeMatches';
import { consumeMembershipActivationTip } from '../../utils/membershipTips';
import {
  benefits,
  invite as fallbackInvite,
  getFallbackPredictions,
  getFallbackSchedules,
  stats as fallbackStats,
  type InviteMock,
  type PredictionMock,
  type ScheduleMock,
  type StatMock,
} from './mock';

const predictionItems = ref<PredictionMock[]>([]);
const scheduleItems = ref<ScheduleMock[]>(getFallbackSchedules());
const statItems = ref<StatMock[]>(fallbackStats);
const invite = ref<InviteMock>(fallbackInvite);
const isMember = ref(false);
const dataSource = ref<'api' | 'fallback'>('fallback');
const chatVisible = ref(false);
const homeDisplayDate = ref('');

const primaryPrediction = computed(() => predictionItems.value[0]);
const secondaryPredictions = computed(() => predictionItems.value.slice(1));
const stats = computed(() => statItems.value);
const schedules = computed(() => scheduleItems.value);
const homePredictionSubtitle = computed(() =>
  predictionItems.value.length > 0
    ? `${homeDisplayDate.value ? '下一比赛日' : '接下来'} ${predictionItems.value.length} 场重点比赛预测已更新`
    : '暂无可推荐比赛',
);
const predictionSectionDesc = computed(() =>
  predictionItems.value.length > 0
    ? '最近开赛场次已更新 · 赛前发布，临场滚动更新'
    : '如当前时段暂无未开赛场次，将自动展示下一比赛日推荐',
);
const homeStatusText = computed(() =>
  dataSource.value === 'api' ? '云端预测已更新' : '最近开赛场次已更新',
);
const homeTags = computed(() => [
  '接下来4场重点比赛',
  '最近开赛场次已更新',
  '北京时间',
]);
const accessNoteText = computed(() =>
  isMember.value
    ? '会员已解锁接下来重点比赛完整分析'
    : '非会员可查看1场完整预测，会员可解锁更多赛前分析',
);

onShow(() => {
  consumeMembershipActivationTip('home');
  loadHomeData();
});

const tabBarPages = new Set([
  '/pages/index/index',
  '/pages/today/index',
  '/pages/challenge/index',
  '/pages/me/index',
]);

function go(url: string) {
  const cleanUrl = url.split('?')[0];
  const method = tabBarPages.has(cleanUrl) ? uni.switchTab : uni.navigateTo;
  method({
    url,
    fail: () => {
      uni.showToast({ title: '页面打开失败，请稍后重试', icon: 'none' });
    },
  });
}

function openPredictionDetail(_prediction: PredictionMock) {
  if (_prediction.matchId) {
    go(`/pages/match-detail/index?id=${_prediction.matchId}`);
    return;
  }
  go('/pages/today/index');
}

async function loadHomeData() {
  try {
    const data = await api.homeData();
    let todayPredictions: PredictionArchiveResponse | undefined;
    if (!extractPredictions(data).length) {
      todayPredictions = await api.predictionToday().catch(() => undefined);
    }
    applyHomeData(data, todayPredictions);
  } catch {
    applyFallbackData();
  }
}

function applyHomeData(data: CloudHomeData, todayData?: PredictionArchiveResponse) {
  const predictionSource = extractPredictions(data);
  const todayPredictionSource = extractPredictions(todayData);
  const upcomingPredictions = selectUpcomingPredictions(
    predictionSource.length ? predictionSource : todayPredictionSource,
  );
  const upcomingMatches = selectUpcomingMatches(data.matches);
  const matchesFromPredictions = selectUpcomingMatches(
    upcomingPredictions
      .map((item) => item.match)
      .filter((item): item is Match => Boolean(item)),
  );

  predictionItems.value = upcomingPredictions.length
    ? upcomingPredictions.map(mapPrediction)
    : [];
  const selectedMatches = upcomingMatches.length ? upcomingMatches : matchesFromPredictions;
  scheduleItems.value = selectedMatches.map(mapSchedule);
  statItems.value = mapStats(data.stats);
  invite.value = {
    code: data.invite.inviteCode || fallbackInvite.code,
    invitedCount: data.invite.invitedCount || 0,
    paidInvitedCount: data.invite.invitedPaidCount || 0,
    rewards: fallbackInvite.rewards,
  };
  isMember.value = data.isMember;
  dataSource.value = 'api';
  homeDisplayDate.value = nextPredictionDate(data, todayData);
}

function applyFallbackData() {
  const fallbackPredictions = getFallbackPredictions();
  const fallbackSchedules = getFallbackSchedules();
  if (import.meta.env.DEV || import.meta.env.VITE_DEMO_MODE === 'true') {
    predictionItems.value = fallbackPredictions;
    scheduleItems.value = fallbackSchedules;
  } else {
    predictionItems.value = [];
    scheduleItems.value = [];
  }
  statItems.value = fallbackStats;
  invite.value = fallbackInvite;
  isMember.value = false;
  dataSource.value = 'fallback';
  homeDisplayDate.value = '';
}

function mapPrediction(item: PredictionArchive): PredictionMock {
  const record = item as PredictionArchive & Record<string, unknown>;
  const match = item.match;
  const homeTeamName = stringValue(record.homeTeamName)
    || stringValue(record.homeTeam)
    || match?.homeTeam?.name
    || '';
  const awayTeamName = stringValue(record.awayTeamName)
    || stringValue(record.awayTeam)
    || match?.awayTeam?.name
    || '';
  const predictedHome = numberValue(record.predictedHome);
  const predictedAway = numberValue(record.predictedAway);
  const predictedScore = stringValue(record.predictedScore)
    || (predictedHome !== null && predictedAway !== null ? `${predictedHome}-${predictedAway}` : '--');

  return {
    id: item.id,
    matchId: item.matchId,
    kickoffTime: clockText(predictionKickoffAt(item)),
    groupName: item.match?.groupName || '',
    homeTeam: homeTeamName,
    homeFlag: predictionFlag(item, 'home'),
    awayTeam: awayTeamName,
    awayFlag: predictionFlag(item, 'away'),
    predictedScore,
    scoreCandidates: item.scoreCandidates,
    totalGoalsRange: item.totalGoalsRange,
    overUnderLean: item.overUnderLean,
    direction: directionText(stringValue(record.recommendationDirection)),
    confidence: levelText(record.confidenceLevel ?? record.confidenceIndex ?? record.confidence),
    risk: riskText(record.riskLevel ?? record.riskIndex ?? record.risk),
    summary: stringValue(record.shortAnalysis)
      || stringValue(record.recommendationReason)
      || '赛前模型已完成综合分析，建议结合临场信息理性参考。',
    archiveLabel: item.publishedAt ? `已更新 ${dateTimeText(item.publishedAt)}` : '已更新',
    probabilities: {
      home: Number(item.homeWinProbability ?? item.homeWinProb ?? 0),
      draw: Number(item.drawProbability ?? item.drawProb ?? 0),
      away: Number(item.awayWinProbability ?? item.awayWinProb ?? 0),
    },
  };
}

function extractPredictions(source?: unknown): PredictionArchive[] {
  const value = unwrapData(source);
  if (!value || typeof value !== 'object') {
    return [];
  }

  for (const key of ['predictions', 'items', 'matches', 'recommendedMatches']) {
    const candidate = (value as Record<string, unknown>)[key];
    if (Array.isArray(candidate)) {
      return candidate as PredictionArchive[];
    }
  }

  return [];
}

function unwrapData(source?: unknown): unknown {
  if (source && typeof source === 'object' && 'data' in source) {
    return (source as { data?: unknown }).data ?? source;
  }

  return source;
}

function nextPredictionDate(data: CloudHomeData, todayData?: PredictionArchiveResponse) {
  const source = unwrapData(todayData) as Partial<PredictionArchiveResponse> | undefined;
  const nextAvailableDate = source?.nextAvailableDate || data.nextAvailableDate;
  const displayDate = source?.displayDate || data.displayDate;
  const date = source?.date || data.date;
  const isNextAvailable = source?.source === 'next_available'
    || Boolean(nextAvailableDate && data.date && nextAvailableDate !== data.date);

  return isNextAvailable ? (nextAvailableDate || displayDate || date || '') : '';
}

function predictionKickoffAt(item: PredictionArchive) {
  const record = item as PredictionArchive & Record<string, unknown>;
  return stringValue(record.kickoffAt)
    || stringValue(record.kickoffTime)
    || item.match?.kickoffAt
    || '';
}

function predictionFlag(item: PredictionArchive, side: 'home' | 'away') {
  const record = item as PredictionArchive & Record<string, unknown>;
  const direct = stringValue(record[side === 'home' ? 'homeFlag' : 'awayFlag'])
    || stringValue(record[side === 'home' ? 'homeFlagUrl' : 'awayFlagUrl']);
  if (direct) {
    return direct;
  }

  return teamFlag(side === 'home' ? item.match?.homeTeam : item.match?.awayTeam);
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function mapSchedule(match: Match): ScheduleMock {
  return {
    id: match.id,
    kickoffTime: match.kickoffTime || clockText(match.kickoffAt),
    groupName: match.groupName || '',
    homeTeam: match.homeTeam.name,
    homeFlag: teamFlag(match.homeTeam),
    awayTeam: match.awayTeam.name,
    awayFlag: teamFlag(match.awayTeam),
  };
}

function mapStats(source: CloudHomeData['stats']): StatMock[] {
  return [
    {
      label: '胜平负命中率',
      value: `${source.resultHitRate || 0}%`,
      hint: '近30场公开预测',
    },
    {
      label: '比分命中率',
      value: `${source.scoreHitRate || 0}%`,
      hint: '精确比分追踪',
    },
    {
      label: '总预测场次',
      value: String(source.totalPredictions || 0),
      hint: '累计归档记录',
    },
  ];
}

function teamFlag(team?: {
  flagUrl?: string | null;
  flag?: string | null;
  countryCode?: string | null;
  flagCode?: string | null;
  fifaCode?: string | null;
  code?: string | null;
  name?: string | null;
} | null) {
  return getTeamFlag(team || undefined);
}

function directionText(value: string) {
  const map: Record<string, string> = {
    HOME_WIN: '主胜',
    DRAW: '平局',
    AWAY_WIN: '客胜',
  };
  return map[value] || value;
}

function levelText(value?: string | number | null) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value || '中');
  }
  if (numeric >= 80) return '高';
  if (numeric >= 60) return '中高';
  if (numeric >= 40) return '中';
  return '谨慎';
}

function riskText(value?: string | number | null) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return String(value || '中');
  }
  if (numeric >= 75) return '高';
  if (numeric >= 45) return '中';
  return '低';
}

function selectUpcomingPredictions(items: PredictionArchive[]) {
  const now = Date.now();
  return sortByKickoff(items.filter((item) => isActivePrediction(item, now)))
    .slice(0, 4);
}

function selectUpcomingMatches(items: Match[]) {
  const now = Date.now();
  return sortByKickoff(items.filter((item) => isActiveMatch(item, now)))
    .slice(0, 4);
}

function isActivePrediction(item: PredictionArchive, now = Date.now()) {
  return isActiveMatchLike(item, now);
}

function isActiveMatch(item: Match, now = Date.now()) {
  return isActiveMatchLike(item, now);
}

function clockText(value?: string) {
  if (!value) {
    return '--:--';
  }
  const date = new Date(value);
  return `${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`;
}

function dateTimeText(value?: string) {
  if (!value) {
    return '-- --:--';
  }
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${month}-${day} ${clockText(value)}`;
}

</script>

<style scoped lang="scss" src="./home.scss"></style>
