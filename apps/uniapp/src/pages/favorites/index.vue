<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import MatchCard from '../../components/MatchCard.vue';
import type { MatchItem } from '../../services/types';
import { getFavorites, removeFavorite } from '../../utils/favorites';

const favorites = ref<MatchItem[]>([]);

function loadFavorites() {
  favorites.value = getFavorites();
}

function openDetail(id: string) {
  uni.navigateTo({ url: `/pages/match-detail/index?id=${id}` });
}

function remove(id: string) {
  favorites.value = removeFavorite(id);
  uni.showToast({ title: '已取消收藏', icon: 'none' });
}

onShow(loadFavorites);
</script>

<template>
  <view class="page">
    <view class="risk">收藏仅保存在本机，用于快速查看关注比赛。</view>
    <view class="section-title">我的收藏</view>
    <view v-if="favorites.length === 0" class="muted">暂无收藏比赛</view>
    <view v-for="match in favorites" :key="match.id" class="favorite-item">
      <MatchCard :match="match" @open="openDetail" />
      <button class="ghost-btn" @tap="remove(match.id)">取消收藏</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.favorite-item {
  margin-bottom: 18rpx;
}
</style>
