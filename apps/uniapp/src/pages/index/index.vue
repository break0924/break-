<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import MatchCard from '../../components/MatchCard.vue';
import { getMatches } from '../../services/match';
import type { MatchItem } from '../../services/types';

const loading = ref(false);
const matches = ref<MatchItem[]>([]);

async function loadMatches() {
  loading.value = true;
  try {
    const result = await getMatches();
    matches.value = result.items;
  } finally {
    loading.value = false;
  }
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages/match-detail/index?id=${id}` });
}

onShow(() => {
  void loadMatches();
});
</script>

<template>
  <view class="page">
    <view class="risk">仅提供赛事信息、模拟方案和理论计算，不提供购买、充值或兑奖功能。</view>
    <view class="section-title">世界杯赛程</view>
    <view v-if="loading" class="muted">加载中...</view>
    <MatchCard v-for="match in matches" :key="match.id" :match="match" @open="openDetail" />
    <view v-if="!loading && matches.length === 0" class="muted">暂无赛程数据</view>
  </view>
</template>
