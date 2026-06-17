<template>
  <view class="stats-card">
    <text class="value">{{ stat.value }}</text>
    <text class="label">{{ stat.label }}</text>
    <text class="hint">{{ stat.hint }}</text>
  </view>
</template>

<script setup lang="ts">
import type { StatMock } from '../mock';

defineProps<{
  stat: StatMock;
}>();
</script>

<style scoped lang="scss">
.stats-card {
  min-height: 166rpx;
  box-sizing: border-box;
  padding: 20rpx 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 50% 0%, rgba(255, 216, 130, 0.15), transparent 44%),
    rgba(10, 20, 42, 0.8);
  text-align: center;
}

.value,
.label,
.hint {
  display: block;
}

.value {
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 900;
}

.label {
  margin-top: 10rpx;
  color: #e8f0ff;
  font-size: 22rpx;
  font-weight: 800;
}

.hint {
  margin-top: 8rpx;
  color: rgba(214, 229, 255, 0.52);
  font-size: 19rpx;
  line-height: 1.35;
}
</style>
