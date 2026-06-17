<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { getMatchDetail } from '../../services/match';
import type { MatchItem } from '../../services/types';
import { addFavorite, isFavorite, removeFavorite } from '../../utils/favorites';
import { formatDateTime } from '../../utils/date';

const loading = ref(false);
const match = ref<MatchItem | null>(null);
const favorite = ref(false);

const scoreText = computed(() => {
  if (!match.value || match.value.homeScore === undefined || match.value.awayScore === undefined) {
    return '未完赛';
  }
  return `${match.value.homeScore}:${match.value.awayScore}`;
});

async function loadMatch(id: string) {
  loading.value = true;
  try {
    match.value = await getMatchDetail(id);
    favorite.value = isFavorite(id);
  } finally {
    loading.value = false;
  }
}

function toggleFavorite() {
  if (!match.value) return;

  if (favorite.value) {
    removeFavorite(match.value.id);
    favorite.value = false;
    uni.showToast({ title: '已取消收藏', icon: 'none' });
    return;
  }

  addFavorite(match.value);
  favorite.value = true;
  uni.showToast({ title: '已收藏', icon: 'success' });
}

onLoad((query) => {
  if (query?.id) {
    void loadMatch(String(query.id));
  }
});
</script>

<template>
  <view class="page">
    <view class="risk">AI 分析仅供信息参考，不构成购买建议。</view>
    <view v-if="loading" class="muted">加载中...</view>
    <view v-else-if="match">
      <view class="card head">
        <view class="team">{{ match.homeTeam.name }}</view>
        <view class="score">{{ scoreText }}</view>
        <view class="team">{{ match.awayTeam.name }}</view>
      </view>
      <view class="card info">
        <view>{{ match.matchNo }} · {{ match.stage }} · {{ match.status }}</view>
        <view>{{ formatDateTime(match.kickoffAt) }} · {{ match.venue || '待定场地' }}</view>
      </view>
      <button class="ghost-btn" @tap="toggleFavorite">{{ favorite ? '取消收藏' : '收藏比赛' }}</button>

      <view class="section-title">赔率快照</view>
      <view class="card odds" v-if="match.oddsSnapshots?.length">
        <view class="odds-row odds-head">
          <text>玩法</text>
          <text>选项</text>
          <text>赔率</text>
        </view>
        <view v-for="odds in match.oddsSnapshots" :key="odds.id" class="odds-row">
          <text>{{ odds.market }}</text>
          <text>{{ odds.selection }}</text>
          <text>{{ odds.odds }}</text>
        </view>
      </view>
      <view v-else class="muted">暂无赔率数据</view>

      <view class="section-title">AI 分析</view>
      <view v-if="match.aiAnalyses?.length" class="card analysis">
        <view class="analysis-title">{{ match.aiAnalyses[0].title || '赛前分析' }}</view>
        <view>{{ match.aiAnalyses[0].summary }}</view>
      </view>
      <view v-else class="muted">暂无已发布 AI 分析</view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.head {
  display: grid;
  grid-template-columns: 1fr 120rpx 1fr;
  align-items: center;
  text-align: center;
}

.team {
  font-size: 32rpx;
  font-weight: 700;
}

.score {
  color: #0f766e;
  font-size: 32rpx;
  font-weight: 800;
}

.info {
  display: grid;
  gap: 8rpx;
  color: #475569;
  font-size: 26rpx;
}

.odds {
  padding: 0;
  overflow: hidden;
}

.odds-row {
  display: grid;
  grid-template-columns: 1fr 1fr 120rpx;
  gap: 12rpx;
  padding: 18rpx;
  border-bottom: 1rpx solid #e2e8f0;
  font-size: 24rpx;
}

.odds-row:last-child {
  border-bottom: 0;
}

.odds-head {
  color: #475569;
  background: #f1f5f9;
  font-weight: 700;
}

.analysis {
  line-height: 1.6;
}

.analysis-title {
  margin-bottom: 10rpx;
  font-weight: 700;
}
</style>
