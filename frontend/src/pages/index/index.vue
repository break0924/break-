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
        <view class="nav-member" @tap="go('/pages/membership/index')">会员</view>
      </view>

      <HomeBanner
        title="2026世界杯 AI每日预测"
        :subtitle="`接下来 ${predictionItems.length} 场重点比赛预测已更新`"
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
              接下来 {{ predictionItems.length }} 场重点比赛预测 · 最近开赛场次已更新
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
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type { CloudHomeData, Match, PredictionArchive } from '../../api/types';
import ChallengeBanner from './components/ChallengeBanner.vue';
import HomeBanner from './components/HomeBanner.vue';
import InviteFriendsCard from './components/InviteFriendsCard.vue';
import MembershipBenefits from './components/MembershipBenefits.vue';
import PredictionCard from './components/PredictionCard.vue';
import ScheduleCard from './components/ScheduleCard.vue';
import StatsCard from './components/StatsCard.vue';
import { getTeamFlag } from '../../utils/assets';
import { normalizeMatchStatus } from '../../utils/format';
import { consumeMembershipActivationTip } from '../../utils/membershipTips';
import {
  benefits,
  invite as fallbackInvite,
  predictions as fallbackPredictions,
  schedules as fallbackSchedules,
  stats as fallbackStats,
  type InviteMock,
  type PredictionMock,
  type ScheduleMock,
  type StatMock,
} from './mock';

const predictionItems = ref<PredictionMock[]>([]);
const scheduleItems = ref<ScheduleMock[]>(fallbackSchedules);
const statItems = ref<StatMock[]>(fallbackStats);
const invite = ref<InviteMock>(fallbackInvite);
const isMember = ref(false);
const dataSource = ref<'api' | 'fallback'>('fallback');

const primaryPrediction = computed(() => predictionItems.value[0]);
const secondaryPredictions = computed(() => predictionItems.value.slice(1));
const stats = computed(() => statItems.value);
const schedules = computed(() => scheduleItems.value);
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
    applyHomeData(data);
  } catch {
    applyFallbackData();
  }
}

function applyHomeData(data: CloudHomeData) {
  const upcomingPredictions = selectUpcomingPredictions(data.predictions);
  const upcomingMatches = selectUpcomingMatches(data.matches);
  const matchesFromPredictions = selectUpcomingMatches(
    upcomingPredictions
      .map((item) => item.match)
      .filter((item): item is Match => Boolean(item)),
  );

  predictionItems.value = upcomingPredictions.length
    ? upcomingPredictions.map(mapPrediction)
    : [];
  scheduleItems.value = (upcomingMatches.length ? upcomingMatches : matchesFromPredictions).length
    ? (upcomingMatches.length ? upcomingMatches : matchesFromPredictions).map(mapSchedule)
    : fallbackSchedules;
  statItems.value = mapStats(data.stats);
  invite.value = {
    code: data.invite.inviteCode || fallbackInvite.code,
    invitedCount: data.invite.invitedCount || 0,
    paidInvitedCount: data.invite.invitedPaidCount || 0,
    rewards: fallbackInvite.rewards,
  };
  isMember.value = data.isMember;
  dataSource.value = 'api';
}

function applyFallbackData() {
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
}

function mapPrediction(item: PredictionArchive): PredictionMock {
  return {
    id: item.id,
    matchId: item.matchId,
    kickoffTime: clockText(item.kickoffAt),
    groupName: item.match?.groupName || '',
    homeTeam: item.homeTeamName,
    homeFlag: teamFlag(item.match?.homeTeam),
    awayTeam: item.awayTeamName,
    awayFlag: teamFlag(item.match?.awayTeam),
    predictedScore: item.predictedScore || `${item.predictedHome}-${item.predictedAway}`,
    scoreCandidates: item.scoreCandidates,
    totalGoalsRange: item.totalGoalsRange,
    overUnderLean: item.overUnderLean,
    direction: directionText(item.recommendationDirection),
    confidence: levelText(item.confidenceLevel ?? item.confidenceIndex),
    risk: riskText(item.riskLevel ?? item.riskIndex),
    summary: item.shortAnalysis || item.recommendationReason || '赛前模型已完成综合分析，建议结合临场信息理性参考。',
    archiveLabel: item.publishedAt ? `已更新 ${dateTimeText(item.publishedAt)}` : '已更新',
    probabilities: {
      home: Number(item.homeWinProbability ?? item.homeWinProb ?? 0),
      draw: Number(item.drawProbability ?? item.drawProb ?? 0),
      away: Number(item.awayWinProbability ?? item.awayWinProb ?? 0),
    },
  };
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
  return [...items]
    .filter((item) => isActivePrediction(item, now))
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, 4);
}

function selectUpcomingMatches(items: Match[]) {
  const now = Date.now();
  return [...items]
    .filter((item) => isActiveMatch(item, now))
    .sort((a, b) => new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime())
    .slice(0, 4);
}

function isActivePrediction(item: PredictionArchive, now = Date.now()) {
  const archiveLabel = String(item.archiveLabel || '');
  const resultStatus = String(item.resultStatus || '').toUpperCase();
  const stage = String(item.predictionStage || '').toUpperCase();
  if (
    archiveLabel.includes('归档') ||
    ['ARCHIVED', 'ENDED', 'FINISHED', 'RESULTED'].includes(stage) ||
    ['SETTLED', 'RESULTED'].includes(resultStatus)
  ) {
    return false;
  }

  return isActiveKickoff(item.kickoffAt, now) && isActiveMatchStatus(item.match?.status);
}

function isActiveMatch(item: Match, now = Date.now()) {
  return isActiveKickoff(item.kickoffAt, now) && isActiveMatchStatus(item.status);
}

function isActiveMatchStatus(status?: string | null) {
  const normalized = normalizeMatchStatus(status);
  return normalized === 'SCHEDULED' || normalized === 'LIVE';
}

function isActiveKickoff(kickoffAt?: string | null, now = Date.now()) {
  if (!kickoffAt) {
    return false;
  }

  const kickoffTime = new Date(kickoffAt).getTime();
  return Number.isFinite(kickoffTime) && now < kickoffTime + 120 * 60 * 1000;
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
