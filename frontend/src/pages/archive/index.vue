<template>
  <view class="page archive-page">
    <view class="archive-hero">
      <view class="eyebrow">Prediction Archive</view>
      <view class="h1">历史战绩</view>
      <view class="sub">所有预测公开归档，持续追踪分析表现。</view>
      <view class="method-note">
        胜平负按推荐方向统计；比分参考命中指赛果命中主预测比分或任一候选比分；高信心仅统计高信心已归档场次。
      </view>
    </view>

    <view class="section-title">历史命中率</view>
    <view v-if="statsLoading" class="card muted">统计加载中...</view>
    <view v-else class="stats-panel">
      <view class="stats-primary">
        <view
          v-for="item in primaryStats"
          :key="item.label"
          class="stat-card primary"
        >
          <view class="stat-value">{{ item.value }}</view>
          <view class="stat-label">{{ item.label }}</view>
          <view class="stat-sample">{{ item.sample }}</view>
        </view>
      </view>
      <view class="more-stats-toggle" @tap="showMoreStats = !showMoreStats">
        {{ showMoreStats ? '收起统计' : '查看更多统计' }}
      </view>
      <view v-if="showMoreStats" class="stats-secondary">
        <view
          v-for="item in secondaryStats"
          :key="item.label"
          class="stat-card"
        >
          <view class="stat-value">{{ item.value }}</view>
          <view class="stat-label">{{ item.label }}</view>
          <view class="stat-sample">{{ item.sample }}</view>
        </view>
      </view>
    </view>

    <view class="section-title">筛选</view>
    <view class="filters">
      <view class="segmented">
        <view
          v-for="item in rangeOptions"
          :key="item.value"
          class="segment"
          :class="{ active: rangeFilter === item.value }"
          @tap="setRangeFilter(item.value)"
        >
          {{ item.label }}
        </view>
      </view>
      <view class="segmented">
        <view
          v-for="item in hitOptions"
          :key="item.value"
          class="segment"
          :class="{ active: hitFilter === item.value }"
          @tap="setHitFilter(item.value)"
        >
          {{ item.label }}
        </view>
      </view>
    </view>

    <view class="section-title">预测归档</view>
    <view v-if="loading" class="card muted">归档加载中...</view>
    <view v-else-if="archives.length === 0" class="card muted">暂无符合条件的归档</view>

    <view v-for="item in archives" :key="item.id" class="card archive-card">
      <view class="archive-top">
        <view>
          <view class="match-title">{{ item.homeTeamName }} vs {{ item.awayTeamName }}</view>
          <view class="muted">
            {{ formatKickoff(item.kickoffAt) }} · {{ matchStatusLabel(item.match?.status) }}
          </view>
        </view>
        <view class="result-summary">
          <view v-if="item.settlement" class="actual-score">
            赛果 {{ item.settlement.homeScore }}-{{ item.settlement.awayScore }}
          </view>
          <view class="hit-badge" :class="{ miss: item.settlement && !item.settlement.hitResult }">
            {{ settlementStatusText(item) }}
          </view>
        </view>
      </view>

      <view class="archive-mark">
        <text>预测已归档</text>
        <text v-if="item.publishedAt">发布 {{ formatKickoff(item.publishedAt) }}</text>
      </view>

      <view class="prediction-block">
        <view class="info-card">
          <view class="info-label">推荐方向</view>
          <view class="info-value">{{ directionLabel(item.recommendationDirection) }}</view>
        </view>
        <view class="info-card">
          <view class="info-label">主预测比分</view>
          <view class="info-value">{{ item.predictedHome }}-{{ item.predictedAway }}</view>
        </view>
      </view>

      <view v-if="item.settlement" class="settlement">
        <view :class="{ hit: item.settlement.hitResult }">方向命中：{{ hitText(item.settlement.hitResult) }}</view>
        <view :class="{ hit: isScoreReferenceHit(item) }">比分参考：{{ hitText(isScoreReferenceHit(item)) }}</view>
        <view :class="{ hit: item.settlement.hitScore }">精确命中：{{ hitText(item.settlement.hitScore) }}</view>
      </view>
      <view v-else-if="item.match?.status === 'FINISHED'" class="settlement pending">
        赛果：{{ formatMatchResult(item.match) }} · 积分结算中
      </view>
      <view v-else class="settlement pending">待赛果</view>

      <view class="detail-toggle" @tap="toggleExpanded(item.id)">
        {{ expandedIds.includes(item.id) ? '收起详情' : '展开详情' }}
      </view>

      <view v-if="expandedIds.includes(item.id)" class="archive-extra">
        <view class="prob-row">
          <view>主胜 <text>{{ percent(item.homeWinProb) }}</text></view>
          <view>平局 <text>{{ percent(item.drawProb) }}</text></view>
          <view>客胜 <text>{{ percent(item.awayWinProb) }}</text></view>
        </view>
        <view class="settlement detail">
          <view :class="{ hit: item.settlement?.hitScore }">主预测比分：{{ hitText(Boolean(item.settlement?.hitScore)) }}</view>
          <view :class="{ hit: isCandidateHit(item) }">候选比分：{{ hitText(isCandidateHit(item)) }}</view>
          <view :class="{ hit: isUnbeatenHit(item) }">不败方向：{{ hitText(isUnbeatenHit(item)) }}</view>
          <view>候选：{{ candidateScoreText(item) }}</view>
          <view>发布：{{ item.publishedAt ? formatKickoff(item.publishedAt) : '已归档' }}</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onHide, onShareAppMessage, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type { PredictionArchive, PredictionStats } from '../../api/types';
import {
  directionLabel,
  formatKickoff,
  formatMatchResult,
  matchStatusLabel,
  settlementStatusText,
} from '../../utils/format';
import { subscribeMatchMonitor } from '../../utils/match-monitor';

const loading = ref(false);
const statsLoading = ref(false);
const archiveRows = ref<PredictionArchive[]>([]);
const stats = ref<PredictionStats | null>(null);
const rangeFilter = ref<'7d' | '30d' | 'all'>('all');
const hitFilter = ref<'all' | 'hit' | 'miss'>('all');
const showMoreStats = ref(false);
const expandedIds = ref<string[]>([]);
let unsubscribeMonitor: (() => void) | null = null;

const rangeOptions = [
  { label: '最近7天', value: '7d' as const },
  { label: '最近30天', value: '30d' as const },
  { label: '全部归档', value: 'all' as const },
];
const hitOptions = [
  { label: '全部', value: 'all' as const },
  { label: '命中', value: 'hit' as const },
  { label: '未命中', value: 'miss' as const },
];

const settledCount = computed(() => stats.value?.settledPredictions || 0);
const primaryStats = computed(() => [
  statDisplay('胜平负命中率', stats.value?.resultHitRate || 0, hitCount(stats.value?.resultHitRate, settledCount.value), settledCount.value),
  statDisplay('比分参考命中率', scoreReferenceRate.value, hitCount(scoreReferenceRate.value, settledCount.value), settledCount.value),
  {
    label: '已归档比赛',
    value: String(stats.value?.archivedMatchCount || stats.value?.settledPredictions || 0),
    sample: '已结束可统计场次',
  },
]);
const secondaryStats = computed(() => {
  const highTotal = stats.value?.highConfidenceSettledCount || stats.value?.highConfidenceStats?.count || 0;
  return [
    statDisplay('主预测比分命中率', stats.value?.scoreHitRate || 0, hitCount(stats.value?.scoreHitRate, settledCount.value), settledCount.value),
    statDisplay('候选比分命中率', stats.value?.scoreCandidateHitRate || 0, hitCount(stats.value?.scoreCandidateHitRate, settledCount.value), settledCount.value),
    statDisplay('精确比分命中率', stats.value?.scoreHitRate || 0, hitCount(stats.value?.scoreHitRate, settledCount.value), settledCount.value),
    statDisplay('高信心命中率', stats.value?.highConfidenceHitRate || stats.value?.highConfidenceStats?.resultHitRate || 0, hitCount(stats.value?.highConfidenceHitRate || stats.value?.highConfidenceStats?.resultHitRate, highTotal), highTotal),
    statDisplay('不败方向命中率', stats.value?.unbeatenHitRate || 0, hitCount(stats.value?.unbeatenHitRate, settledCount.value), settledCount.value),
  ];
});
const scoreReferenceRate = computed(() =>
  stats.value?.scoreReferenceHitRate ?? stats.value?.scoreCandidateHitRate ?? 0,
);
const archives = computed(() =>
  archiveRows.value.filter((item) => matchRange(item) && matchHitFilter(item)),
);

onShow(() => {
  loadStats();
  loadArchive();
  unsubscribeMonitor?.();
  unsubscribeMonitor = subscribeMatchMonitor((event) => {
    if (
      event.type === 'match.settlement.updated' ||
      event.type === 'match.result.corrected' ||
      event.type === 'match.status.changed'
    ) {
      loadStats();
      loadArchive();
    }
  });
});

onHide(() => {
  unsubscribeMonitor?.();
  unsubscribeMonitor = null;
});

onShareAppMessage(() => ({
  title: 'AI世界杯预测官历史战绩',
  path: '/pages/archive/index',
}));

async function loadStats() {
  statsLoading.value = true;
  try {
    stats.value = await api.predictionStats();
  } catch {
    stats.value = null;
  } finally {
    statsLoading.value = false;
  }
}

async function loadArchive() {
  loading.value = true;
  try {
    const res = await api.predictionArchive({
      hit: hitFilter.value === 'all' ? undefined : hitFilter.value,
    });
    archiveRows.value = res.predictions || [];
  } catch {
    archiveRows.value = [];
  } finally {
    loading.value = false;
  }
}

function setRangeFilter(value: typeof rangeFilter.value) {
  rangeFilter.value = value;
}

function setHitFilter(value: typeof hitFilter.value) {
  hitFilter.value = value;
  loadArchive();
}

function toggleExpanded(id: string) {
  expandedIds.value = expandedIds.value.includes(id)
    ? expandedIds.value.filter((item) => item !== id)
    : [...expandedIds.value, id];
}

function percent(value: number | string) {
  return `${Number(value).toFixed(0)}%`;
}

function hitText(value: boolean) {
  return value ? '命中' : '未命中';
}

function statDisplay(label: string, rateValue: number, hit: number, total: number) {
  return {
    label,
    value: `${Math.round(Number(rateValue || 0))}%`,
    sample: total ? `${hit}/${total}` : '暂无样本',
  };
}

function hitCount(rateValue: number | undefined, total: number) {
  if (!total) return 0;
  return Math.round((Number(rateValue || 0) / 100) * total);
}

function matchRange(item: PredictionArchive) {
  if (rangeFilter.value === 'all') return true;
  const days = rangeFilter.value === '7d' ? 7 : 30;
  const kickoffTime = new Date(item.kickoffAt).getTime();
  if (!Number.isFinite(kickoffTime)) return true;
  const now = Date.now();
  return kickoffTime >= now - days * 24 * 60 * 60 * 1000 && kickoffTime <= now + 24 * 60 * 60 * 1000;
}

function matchHitFilter(item: PredictionArchive) {
  if (hitFilter.value === 'all') return true;
  const isHit = Boolean(item.settlement?.hitResult);
  return hitFilter.value === 'hit' ? isHit : !isHit && Boolean(item.settlement);
}

function candidateScoreText(item: PredictionArchive) {
  const candidates = item.scoreCandidates || [];
  if (!candidates.length) {
    return `${item.predictedHome}-${item.predictedAway}`;
  }

  return candidates
    .slice(0, 3)
    .map((candidate) => candidate.text || `${candidate.home}-${candidate.away}`)
    .join(' / ');
}

function isCandidateHit(item: PredictionArchive) {
  if (item.settlement?.hitScoreCandidate !== undefined) {
    return item.settlement.hitScoreCandidate;
  }
  if (!item.settlement) {
    return false;
  }

  const candidates = item.scoreCandidates || [];
  return candidates.some(
    (candidate) =>
      Number(candidate.home) === item.settlement?.homeScore &&
      Number(candidate.away) === item.settlement?.awayScore,
  );
}

function isScoreReferenceHit(item: PredictionArchive) {
  if (item.settlement?.hitScoreReference !== undefined) {
    return item.settlement.hitScoreReference;
  }
  return Boolean(item.settlement?.hitScore) || isCandidateHit(item);
}

function isUnbeatenHit(item: PredictionArchive) {
  if (item.settlement?.hitUnbeaten !== undefined) {
    return item.settlement.hitUnbeaten;
  }
  if (!item.settlement) {
    return false;
  }

  const actual = item.settlement.resultDirection;
  if (item.recommendationDirection === 'HOME_WIN') {
    return actual === 'HOME_WIN' || actual === 'DRAW';
  }
  if (item.recommendationDirection === 'AWAY_WIN') {
    return actual === 'AWAY_WIN' || actual === 'DRAW';
  }
  return actual === 'DRAW';
}

</script>

<style scoped>
.archive-page {
  min-height: 100vh;
  color: #f4f8ff;
  background:
    radial-gradient(circle at 18% 0%, rgba(76, 126, 255, 0.24), transparent 34%),
    radial-gradient(circle at 92% 10%, rgba(246, 184, 73, 0.18), transparent 26%),
    linear-gradient(180deg, #07152e 0%, #070f22 48%, #040812 100%);
}

.archive-hero {
  position: relative;
  overflow: hidden;
  padding: 34rpx 28rpx 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 28rpx;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.035)),
    radial-gradient(circle at 80% 10%, rgba(255, 216, 130, 0.18), transparent 34%);
}

.method-note {
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  border-radius: 18rpx;
  color: rgba(222, 232, 255, 0.72);
  background: rgba(255, 255, 255, 0.07);
  font-size: 23rpx;
  line-height: 1.55;
}

.stats-panel {
  display: grid;
  gap: 14rpx;
}

.stats-primary,
.stats-secondary {
  display: grid;
  gap: 14rpx;
}

.stats-primary {
  grid-template-columns: repeat(3, 1fr);
}

.stats-secondary {
  grid-template-columns: repeat(2, 1fr);
}

.stat-card {
  min-height: 138rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.065);
  box-sizing: border-box;
}

.stat-card.primary {
  background: linear-gradient(145deg, rgba(42, 91, 231, 0.25), rgba(246, 184, 73, 0.1));
}

.stat-value {
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 950;
}

.stat-label {
  margin-top: 8rpx;
  color: rgba(222, 232, 255, 0.72);
  font-size: 21rpx;
}

.stat-sample {
  margin-top: 6rpx;
  color: #ffd98a;
  font-size: 20rpx;
  font-weight: 800;
}

.more-stats-toggle,
.detail-toggle {
  padding: 16rpx;
  border-radius: 16rpx;
  color: #ffd98a;
  text-align: center;
  background: rgba(255, 255, 255, 0.055);
  font-size: 24rpx;
  font-weight: 850;
}

.filters {
  display: grid;
  gap: 14rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.055);
}

.segmented {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
}

.segment {
  height: 62rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10rpx;
  color: rgba(222, 232, 255, 0.58);
  background: rgba(0, 0, 0, 0.22);
  font-size: 24rpx;
}

.segment.active {
  color: #10141e;
  background: linear-gradient(135deg, #ffdd7a, #f4ae2f);
  font-weight: 900;
}

.archive-card {
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(145deg, rgba(14, 30, 66, 0.94), rgba(8, 14, 30, 0.94));
}

.match-title {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.archive-top {
  display: flex;
  justify-content: space-between;
  gap: 18rpx;
  align-items: flex-start;
}

.result-summary {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
}

.actual-score {
  padding: 9rpx 14rpx;
  border-radius: 999rpx;
  color: #10141e;
  background: #ffd98a;
  font-size: 23rpx;
  font-weight: 950;
}

.hit-badge {
  padding: 8rpx 14rpx;
  border-radius: 999rpx;
  color: #0d2b1a;
  background: #79f0a8;
  font-size: 22rpx;
  font-weight: 900;
}

.hit-badge.miss {
  color: #2a130a;
  background: #ffd0a6;
}

.archive-mark {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 14rpx;
  padding: 14rpx 16rpx;
  border-radius: 16rpx;
  color: #ffd98a;
  background: rgba(248, 213, 109, 0.09);
  font-size: 22rpx;
}

.prediction-block {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12rpx;
  margin-top: 16rpx;
}

.info-card {
  padding: 16rpx;
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.06);
}

.info-card.wide {
  grid-column: span 2;
}

.info-label {
  color: rgba(222, 232, 255, 0.56);
  font-size: 21rpx;
}

.info-value {
  margin-top: 8rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 950;
}

.info-value.small {
  color: #ffd98a;
  font-size: 25rpx;
}

.prob-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
  margin-top: 18rpx;
  color: rgba(222, 232, 255, 0.72);
  font-size: 23rpx;
}

.prob-row view {
  padding: 12rpx 10rpx;
  border-radius: 10rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.18);
}

.prob-row text {
  color: #ffd98a;
  font-weight: 900;
}

.settlement {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10rpx;
  margin-top: 18rpx;
  color: #e8f1ff;
  font-size: 22rpx;
}

.settlement.detail {
  grid-template-columns: repeat(2, 1fr);
  margin-top: 12rpx;
}

.settlement view,
.settlement.pending {
  padding: 12rpx;
  border-radius: 14rpx;
  text-align: center;
  background: rgba(0, 0, 0, 0.22);
}

.settlement view.hit {
  color: #79f0a8;
}

.settlement.pending {
  display: block;
  color: rgba(222, 232, 255, 0.62);
}

.archive-extra {
  margin-top: 12rpx;
}
</style>
