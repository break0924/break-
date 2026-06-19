<template>
  <view class="page today-page">
    <view class="page-bg">
      <view class="glow glow-blue" />
      <view class="glow glow-red" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <view class="hero today-hero">
      <view class="eyebrow">Daily Match Intelligence</view>
      <view class="h1">{{ recommendationTitle }}</view>
      <view class="sub">{{ recommendationIntro }}</view>
      <view class="hero-tags">
        <view>公开归档</view>
        <view>会员可看完整理由</view>
      </view>
      <view class="hero-note">非会员可查看摘要，会员可查看完整推荐理由，所有推荐公开归档。</view>
    </view>

    <view class="filter-tabs">
      <view
        v-for="tab in tabs"
        :key="tab.value"
        class="filter-tab"
        :class="{ active: activeTab === tab.value }"
        @tap="activeTab = tab.value"
      >
        {{ tab.label }}
      </view>
    </view>

    <view v-if="loading" class="state-card">生成内容加载中...</view>
    <view v-else-if="!data" class="state-card">
      <view class="section-title compact">AI分析生成中</view>
      <view class="muted">可稍后刷新，或等待后台定时任务生成。</view>
    </view>

    <view
      v-for="item in filteredMatches"
      :key="item.id"
      class="recommend-card"
      :class="{ finished: isFinishedStatus(item.match.status), locked: isLockedForViewer(item) }"
    >
      <view class="card-head">
        <view class="teams">
          <view class="team">
            <TeamFlag :team="item.match.homeTeam" />
            <text>{{ item.match.homeTeam.name }}</text>
          </view>
          <view class="vs-wrap">
            <view class="vs">VS</view>
            <view class="kickoff">{{ formatKickoff(item.match.kickoffAt) }}</view>
          </view>
          <view class="team away">
            <TeamFlag :team="item.match.awayTeam" />
            <text>{{ item.match.awayTeam.name }}</text>
          </view>
        </view>

        <view class="meta-row">
          <view class="group-pill">{{ item.match.groupName || item.match.roundName || '世界杯' }}</view>
          <view class="status-pill" :class="statusClass(item.match.status)">
            {{ matchStatusLabel(item.match.status) }}
          </view>
          <view class="archive-pill">预测已归档</view>
        </view>
      </view>

      <view class="core-grid" :class="{ locked: isLockedForViewer(item) }">
        <view class="core-item direction">
          <view class="direction-label">推荐方向</view>
          <view class="direction-result">{{ directionText(item) }}</view>
        </view>
        <view v-if="!isLockedForViewer(item)" class="core-item score">
          <view class="core-label">比分参考</view>
          <view class="core-value">{{ scoreReference(item) }}</view>
          <view v-if="candidateScoreText(item)" class="score-candidates">
            {{ candidateScoreText(item) }}
          </view>
        </view>
        <view v-if="!isLockedForViewer(item)" class="core-item confidence">
          <view class="core-label">信心</view>
          <view class="core-value">{{ confidenceLevel(item.confidenceIndex) }}</view>
        </view>
        <view v-if="!isLockedForViewer(item)" class="core-item risk-card">
          <view class="core-label">风险</view>
          <view class="core-value risk">{{ riskLevel(item.riskIndex) }}</view>
        </view>
      </view>

      <view class="free-summary">
        <view v-if="item.totalGoalsRange && !isLockedForViewer(item)" class="summary-row">
          <text class="summary-label">总进球</text>
          <text class="summary-text">{{ item.totalGoalsRange }} · {{ item.overUnderLean || '均衡' }}</text>
        </view>
        <view class="summary-row">
          <text class="summary-label">免费摘要</text>
          <text class="summary-text">{{ shortSummary(item.freeReason) }}</text>
        </view>
        <view v-if="!isLockedForViewer(item)" class="summary-row risk-row">
          <text class="summary-label">风险提示</text>
          <text class="risk-note">{{ riskHint(item.riskIndex) }}</text>
        </view>
      </view>

      <view v-if="!isFinishedStatus(item.match.status) && !isLockedForViewer(item)" class="light-action">
        <text>会员可查看完整推荐理由</text>
        <text class="light-action-link" @tap="goChallenge(item.match.id)">去参与本场挑战</text>
      </view>

      <view v-if="isFinishedStatus(item.match.status) && !isLockedForViewer(item)" class="archive-box">
        <view class="archive-chip result">
          <text>赛果</text>
          <text>{{ formatMatchResult(item.match) }}</text>
        </view>
        <view class="archive-chip hit">
          <text>方向命中</text>
          <text :class="['hit-text', { miss: hitLabel(item) === '方向未命中' }]">{{ hitLabel(item) }}</text>
        </view>
        <view class="archive-chip">
          <text>归档</text>
          <text>预测已归档</text>
        </view>
        <view class="archive-chip">
          <text>发布时间</text>
          <text>{{ publishTime }}</text>
        </view>
      </view>

      <view v-if="item.memberReason && !isLockedForViewer(item)" class="member-reason">
        {{ item.memberReason }}
      </view>

      <view v-if="isLockedForViewer(item)" class="member-lock">
        <view class="lock-content">
          <view class="lock-kicker">会员专享</view>
          <view class="lock-title">解锁完整推荐理由、风险提示与更多比分参考</view>
        </view>
        <view class="unlock-btn" @tap="goMembership">立即解锁</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type { DailyRecommendation } from '../../api/types';
import TeamFlag from '../../components/media/TeamFlag.vue';
import {
  formatKickoff,
  formatMatchResult,
  matchStatusLabel,
  normalizeMatchStatus,
} from '../../utils/format';
import { consumeMembershipActivationTip } from '../../utils/membershipTips';

type RecommendationItem = DailyRecommendation['matches'][number];
type FilterTab = 'ALL' | 'SCHEDULED' | 'FINISHED' | 'ARCHIVED';

const loading = ref(false);
const data = ref<DailyRecommendation | null>(null);
const activeTab = ref<FilterTab>('ALL');

const tabs: Array<{ label: string; value: FilterTab }> = [
  { label: '全部', value: 'ALL' },
  { label: '未开始', value: 'SCHEDULED' },
  { label: '已结束', value: 'FINISHED' },
  { label: '已归档', value: 'ARCHIVED' },
];

const matchCount = computed(() => data.value?.matches.length || 0);
const updatedCount = computed(() => data.value?.matches.length || 0);
const recommendationTitle = computed(() => data.value?.title || '今日推荐');
const recommendationIntro = computed(() => {
  if (data.value?.intro) return data.value.intro;

  return `今日共 ${matchCount.value} 场比赛，已更新 ${updatedCount.value} 场赛前分析`;
});
const publishTime = computed(() => formatPublishTime(data.value?.generatedAt));
const normalizedMatches = computed(() => {
  const isMember = Boolean(data.value?.isMember);
  return (data.value?.matches || []).map((item, index) => ({
    ...item,
    locked: isMember ? false : index > 0,
  }));
});
const filteredMatches = computed(() => {
  const items = normalizedMatches.value;
  if (activeTab.value === 'ALL') return items;
  if (activeTab.value === 'ARCHIVED') return items;
  return items.filter((item) => normalizeMatchStatus(item.match.status) === activeTab.value);
});

onShow(() => {
  consumeMembershipActivationTip('today');
  load();
});

async function load() {
  loading.value = true;
  try {
    data.value = await api.todayRecommendation();
  } catch {
    data.value = null;
  } finally {
    loading.value = false;
  }
}

function goMembership() {
  uni.navigateTo({ url: '/pages/membership/index' });
}

function goChallenge(matchId: string) {
  uni.navigateTo({ url: `/pages/prediction-submit/index?matchId=${matchId}` });
}

function isLockedForViewer(item: RecommendationItem) {
  if (data.value?.isMember) return false;
  const index = normalizedMatches.value.findIndex((row) => row.id === item.id);
  return index > 0;
}

function directionText(item: RecommendationItem) {
  if (item.recommendationDirection === 'HOME_WIN') {
    return `${item.match.homeTeam.name}不败`;
  }
  if (item.recommendationDirection === 'AWAY_WIN') {
    return `${item.match.awayTeam.name}不败`;
  }
  return '平局倾向';
}

function scoreReference(item: RecommendationItem) {
  const first = item.scoreCandidates?.[0];
  if (first?.text) {
    return first.text.replace('-', ':');
  }
  return `${item.predictedHome}:${item.predictedAway}`;
}

function candidateScoreText(item: RecommendationItem) {
  const candidates = item.scoreCandidates || [];
  if (candidates.length <= 1) {
    return '';
  }

  return candidates
    .slice(1, 3)
    .map((candidate) => candidate.text.replace('-', ':'))
    .join(' / ');
}

function confidenceLevel(value: number) {
  if (value >= 80) return '高';
  if (value >= 60) return '中高';
  if (value >= 40) return '中';
  return '谨慎';
}

function riskLevel(value: number) {
  if (value >= 75) return '高';
  if (value >= 45) return '中';
  return '低';
}

function riskHint(value: number) {
  if (value >= 75) return '不确定性较高，建议重点关注临场信息。';
  if (value >= 45) return '存在波动，关注阵容与赛前状态。';
  return '风险偏低，仍需理性参考。';
}

function shortSummary(value: string) {
  const fallback = 'AI已完成赛前情报整理，建议结合阵容、状态与临场信息理性参考。';
  const text = value || fallback;
  return text.length > 46 ? `${text.slice(0, 46)}...` : text;
}

function statusClass(status: string) {
  const normalized = normalizeMatchStatus(status);
  return {
    live: normalized === 'LIVE',
    finished: normalized === 'FINISHED',
    muted: normalized === 'POSTPONED' || normalized === 'CANCELLED',
  };
}

function isFinishedStatus(status?: string | null) {
  return normalizeMatchStatus(status) === 'FINISHED';
}

function hitLabel(item: RecommendationItem) {
  if (item.match.homeScore == null || item.match.awayScore == null) return '待追踪';
  const homeScore = Number(item.match.homeScore);
  const awayScore = Number(item.match.awayScore);
  const resultDirection =
    homeScore > awayScore ? 'HOME_WIN' : homeScore < awayScore ? 'AWAY_WIN' : 'DRAW';
  return resultDirection === item.recommendationDirection ? '方向命中' : '方向未命中';
}

function formatPublishTime(value?: string | null) {
  if (!value) return '今日已发布';
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}
</script>

<style scoped>
.today-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 28rpx;
  background:
    radial-gradient(circle at 18% 0%, rgba(64, 134, 255, 0.26), transparent 34%),
    radial-gradient(circle at 92% 10%, rgba(210, 41, 77, 0.18), transparent 30%),
    radial-gradient(circle at 50% 100%, rgba(25, 182, 127, 0.14), transparent 34%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
}

.page-bg,
.today-hero,
.state-card,
.recommend-card {
  position: relative;
  z-index: 1;
}

.glow,
.motion-line {
  pointer-events: none;
  position: absolute;
}

.glow {
  border-radius: 50%;
  opacity: 0.72;
}

.glow-blue {
  top: -90rpx;
  left: -70rpx;
  width: 260rpx;
  height: 260rpx;
  background: rgba(64, 134, 255, 0.3);
}

.glow-red {
  top: 86rpx;
  right: -90rpx;
  width: 280rpx;
  height: 280rpx;
  background: rgba(210, 41, 77, 0.18);
}

.motion-line {
  height: 3rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 216, 130, 0.52), transparent);
  transform: rotate(-16deg);
}

.line-a {
  top: 210rpx;
  right: -90rpx;
  width: 360rpx;
}

.line-b {
  top: 390rpx;
  left: -110rpx;
  width: 300rpx;
  background: linear-gradient(90deg, transparent, rgba(74, 141, 255, 0.44), transparent);
}

.today-hero {
  padding: 38rpx 34rpx 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.13);
  border-radius: 30rpx;
  background: #101f46;
  background-image:
    radial-gradient(circle at 82% 0%, rgba(255, 216, 130, 0.18), transparent 30%),
    linear-gradient(135deg, rgba(17, 38, 88, 0.94), rgba(7, 12, 30, 0.96));
  box-shadow: 0 24rpx 70rpx rgba(0, 0, 0, 0.32);
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.h1 {
  margin-top: 12rpx;
  color: #ffffff;
  font-size: 48rpx;
  font-weight: 900;
  line-height: 1.12;
}

.sub {
  margin-top: 16rpx;
  color: rgba(238, 246, 255, 0.82);
  font-size: 27rpx;
  font-weight: 700;
  line-height: 1.5;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.hero-tags > view {
  padding: 10rpx 16rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.08);
  color: #ffe0a0;
  font-size: 21rpx;
  font-weight: 900;
}

.hero-note {
  margin-top: 16rpx;
  padding: 13rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 18rpx;
  background: rgba(0, 0, 0, 0.14);
  color: rgba(238, 246, 255, 0.58);
  font-size: 21rpx;
  line-height: 1.45;
}

.filter-tabs {
  display: flex;
  flex-direction: row;
  gap: 14rpx;
  margin-top: 26rpx;
  padding: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(5, 10, 24, 0.72);
}

.filter-tab {
  flex: 1;
  min-width: 0;
  padding: 16rpx 8rpx;
  border-radius: 18rpx;
  color: rgba(221, 235, 255, 0.66);
  font-size: 23rpx;
  font-weight: 800;
  line-height: 1;
  text-align: center;
  transition: transform 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.filter-tab.active {
  background: #ffd36f;
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  transform: translateY(-2rpx);
  box-shadow: 0 12rpx 30rpx rgba(255, 216, 121, 0.28);
}

.filter-tab:active {
  transform: scale(0.97);
}

.state-card,
.recommend-card {
  box-sizing: border-box;
  margin-top: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 28rpx;
  background: #101f46;
  background-image:
    radial-gradient(circle at 84% 0%, rgba(255, 216, 130, 0.1), transparent 26%),
    linear-gradient(145deg, rgba(16, 31, 70, 0.9), rgba(7, 12, 28, 0.94));
  box-shadow: 0 22rpx 60rpx rgba(0, 0, 0, 0.28);
}

.state-card {
  padding: 30rpx;
}

.recommend-card {
  overflow: hidden;
  padding: 24rpx;
}

.recommend-card.finished {
  border-color: rgba(255, 216, 130, 0.22);
  background: #1c1f38;
  background-image:
    radial-gradient(circle at 84% 0%, rgba(255, 216, 130, 0.14), transparent 26%),
    linear-gradient(145deg, rgba(28, 31, 56, 0.92), rgba(8, 12, 27, 0.96));
}

.teams {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.team {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: center;
  gap: 11rpx;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.team text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.team.away {
  flex-direction: row-reverse;
  text-align: right;
}

.vs-wrap {
  width: 108rpx;
  flex-shrink: 0;
  text-align: center;
}

.vs {
  display: inline-flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 25rpx;
  font-weight: 900;
  box-shadow: 0 0 28rpx rgba(255, 216, 121, 0.24);
}

.kickoff {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.48);
  font-size: 19rpx;
  font-weight: 800;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}

.group-pill,
.status-pill,
.archive-pill {
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  font-size: 21rpx;
  font-weight: 900;
}

.group-pill {
  background: rgba(64, 134, 255, 0.16);
  color: #cfe0ff;
}

.status-pill {
  background: rgba(255, 216, 130, 0.13);
  color: #ffe0a0;
}

.status-pill.live {
  background: rgba(210, 41, 77, 0.18);
  color: #ffb9c8;
}

.status-pill.finished {
  background: rgba(255, 216, 130, 0.18);
  color: #fff0b6;
}

.status-pill.muted {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(221, 235, 255, 0.62);
}

.archive-pill {
  border: 1rpx solid rgba(255, 216, 130, 0.2);
  background: rgba(255, 216, 130, 0.08);
  color: rgba(255, 224, 160, 0.86);
}

.core-grid {
  display: grid;
  grid-template-columns: 1.18fr 0.91fr 0.91fr;
  gap: 14rpx;
  margin-top: 22rpx;
}

.core-grid.locked {
  grid-template-columns: 1fr;
}

.core-item {
  display: flex;
  min-height: 92rpx;
  box-sizing: border-box;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 15rpx 14rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.18);
  text-align: center;
}

.core-item.direction,
.core-item.score {
  border-color: rgba(255, 216, 130, 0.22);
  background: rgba(255, 216, 130, 0.1);
  background-image: linear-gradient(135deg, rgba(255, 216, 130, 0.16), rgba(64, 134, 255, 0.12));
}

.core-item.direction {
  display: flex;
  grid-column: 1 / -1;
  min-height: 104rpx;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  padding: 20rpx 24rpx;
  border-color: rgba(255, 216, 130, 0.38);
  border-radius: 26rpx;
  background: #0a1b45;
  background-image:
    radial-gradient(circle at 88% 0%, rgba(255, 216, 130, 0.32), transparent 36%),
    linear-gradient(120deg, rgba(20, 55, 130, 0.98), rgba(7, 16, 42, 0.98) 58%, rgba(92, 18, 51, 0.72));
  box-shadow:
    inset 0 1rpx 0 rgba(255, 255, 255, 0.1),
    0 16rpx 40rpx rgba(0, 0, 0, 0.2),
    0 0 28rpx rgba(255, 216, 121, 0.08);
}

.core-label {
  color: rgba(221, 235, 255, 0.54);
  font-size: 19rpx;
  font-weight: 700;
}

.core-value {
  margin-top: 8rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
}

.direction-label {
  flex-shrink: 0;
  padding: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 224, 160, 0.68);
  font-size: 20rpx;
  font-weight: 900;
}

.direction-result {
  min-width: 0;
  flex: 1;
  color: #fff6d7;
  font-size: 50rpx;
  font-weight: 900;
  line-height: 1.15;
  text-align: right;
  text-shadow: 0 0 28rpx rgba(255, 216, 121, 0.26);
}

.core-item.score {
  border-radius: 24rpx;
}

.core-item.score .core-value {
  color: #fff1c2;
  font-size: 43rpx;
  line-height: 1;
  text-shadow: 0 0 22rpx rgba(255, 216, 121, 0.18);
}

.score-candidates {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.62);
  font-size: 19rpx;
  font-weight: 800;
  line-height: 1.2;
}

.core-item.confidence,
.core-item.risk-card {
  padding-top: 15rpx;
  padding-bottom: 15rpx;
}

.core-value.risk {
  color: #ffd879;
}

.free-summary {
  margin-top: 18rpx;
  padding: 14rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.06);
}

.summary-row {
  display: grid;
  grid-template-columns: 116rpx minmax(0, 1fr);
  align-items: start;
  gap: 14rpx;
}

.summary-row + .summary-row {
  margin-top: 8rpx;
}

.summary-label {
  color: rgba(255, 224, 160, 0.72);
  font-size: 20rpx;
  font-weight: 900;
  line-height: 1.45;
}

.summary-text,
.risk-note {
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  color: rgba(238, 246, 255, 0.78);
  font-size: 22rpx;
  line-height: 1.45;
  -webkit-line-clamp: 1;
}

.risk-note {
  color: rgba(255, 224, 160, 0.62);
  font-size: 20rpx;
}

.light-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  margin-top: 14rpx;
  padding: 13rpx 16rpx;
  border: 1rpx solid rgba(64, 134, 255, 0.16);
  border-radius: 18rpx;
  background: rgba(64, 134, 255, 0.07);
  color: rgba(221, 235, 255, 0.58);
  font-size: 20rpx;
  font-weight: 800;
}

.light-action-link {
  flex-shrink: 0;
  color: #ffe0a0;
  font-weight: 900;
}

.archive-box {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  margin-top: 16rpx;
  padding: 14rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.16);
  border-radius: 24rpx;
  background: rgba(0, 0, 0, 0.16);
}

.archive-chip {
  min-height: 92rpx;
  box-sizing: border-box;
  padding: 15rpx 14rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.06);
}

.archive-chip.result {
  border-color: rgba(255, 216, 130, 0.2);
  background: rgba(255, 216, 130, 0.1);
}

.archive-chip.hit {
  border-color: rgba(153, 246, 200, 0.22);
  background: rgba(43, 203, 136, 0.1);
  box-shadow: inset 0 0 28rpx rgba(43, 203, 136, 0.06);
}

.archive-chip text {
  display: block;
}

.archive-chip text:first-child {
  color: rgba(221, 235, 255, 0.54);
  font-size: 20rpx;
  font-weight: 700;
}

.archive-chip text:last-child {
  margin-top: 6rpx;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 900;
}

.hit-text {
  color: #99f6c8 !important;
  text-shadow: 0 0 18rpx rgba(153, 246, 200, 0.16);
}

.hit-text.miss {
  color: #ffd0a6 !important;
}

.member-reason {
  margin-top: 14rpx;
  padding: 16rpx 18rpx;
  border-left: 6rpx solid #ffd879;
  border-radius: 18rpx;
  background: rgba(255, 216, 130, 0.08);
  color: rgba(238, 246, 255, 0.8);
  font-size: 24rpx;
  line-height: 1.6;
}

.member-lock {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 16rpx;
  padding: 15rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.26);
  border-radius: 22rpx;
  background: rgba(8, 15, 34, 0.9);
  background-image:
    radial-gradient(circle at 88% 0%, rgba(255, 216, 130, 0.22), transparent 34%),
    linear-gradient(135deg, rgba(8, 15, 34, 0.76), rgba(5, 9, 21, 0.9));
  box-shadow: inset 0 0 34rpx rgba(255, 216, 130, 0.08);
}

.lock-kicker {
  color: #ffd879;
  font-size: 20rpx;
  font-weight: 900;
}

.lock-title {
  margin-top: 4rpx;
  color: #fff1c2;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.35;
}

.unlock-btn {
  flex-shrink: 0;
  padding: 15rpx 24rpx;
  border-radius: 999rpx;
  background: #ffd36f;
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  text-align: center;
  font-size: 23rpx;
  font-weight: 900;
  box-shadow: 0 14rpx 38rpx rgba(255, 216, 121, 0.24);
}

.compact {
  margin-top: 0;
}

@media (min-width: 900px) {
  .today-page {
    padding: 34px;
  }

  .today-hero,
  .filter-tabs,
  .state-card,
  .recommend-card {
    max-width: 1120px;
    margin-left: auto;
    margin-right: auto;
  }

  .recommend-card {
    padding: 28px;
  }

  .core-grid {
    grid-template-columns: 1.25fr 1fr 1fr;
  }
}
</style>
