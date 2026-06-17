<template>
  <view class="challenge-banner">
    <view class="challenge-copy">
      <view class="kicker">World Cup Challenge</view>
      <view class="title">参与世界杯挑战赛</view>
      <view class="subtitle">预测冠军、四强和每日赛果，冲击排行榜</view>
      <view class="join-btn" @tap="$emit('join')">立即参与</view>
    </view>
    <view class="badge-stack">
      <AppImage src="/static/icons/trophy.svg" custom-class="trophy" mode="aspectFit" />
      <view class="rank-pill">TOP 100</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppImage from '../../../components/media/AppImage.vue';

defineEmits<{
  join: [];
}>();
</script>

<style scoped lang="scss">
.challenge-banner {
  position: relative;
  display: flex;
  min-height: 270rpx;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-top: 34rpx;
  overflow: hidden;
  padding: 28rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.22);
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 85% 20%, rgba(255, 216, 130, 0.2), transparent 32%),
    linear-gradient(135deg, rgba(12, 30, 72, 0.92), rgba(60, 12, 36, 0.88));
}

.challenge-banner::before {
  content: '';
  position: absolute;
  right: -120rpx;
  bottom: -130rpx;
  width: 330rpx;
  height: 330rpx;
  border: 2rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 50%;
}

.challenge-copy,
.badge-stack {
  position: relative;
  z-index: 1;
}

.challenge-copy {
  flex: 1;
  min-width: 0;
}

.kicker {
  color: #ffd879;
  font-size: 21rpx;
  font-weight: 900;
}

.title {
  margin-top: 8rpx;
  color: #ffffff;
  font-size: 36rpx;
  font-weight: 900;
}

.subtitle {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.68);
  font-size: 24rpx;
  line-height: 1.5;
}

.join-btn {
  display: inline-flex;
  margin-top: 22rpx;
  padding: 17rpx 26rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 25rpx;
  font-weight: 900;
}

.badge-stack {
  display: flex;
  width: 176rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
}

:deep(.trophy) {
  width: 132rpx;
  height: 132rpx;
}

.rank-pill {
  margin-top: 12rpx;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.1);
  color: #ffe1a0;
  font-size: 20rpx;
  font-weight: 900;
}
</style>
