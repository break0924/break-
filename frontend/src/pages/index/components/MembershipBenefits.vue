<template>
  <view class="benefit-grid">
    <view
      v-for="item in benefits"
      :key="item.title"
      class="benefit-card"
    >
      <AppImage :src="item.icon" custom-class="benefit-icon" mode="aspectFit" />
      <view class="benefit-title">{{ item.title }}</view>
      <view class="benefit-desc">{{ item.desc }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppImage from '../../../components/media/AppImage.vue';
import type { BenefitMock } from '../mock';

defineProps<{
  benefits: BenefitMock[];
}>();
</script>

<style scoped lang="scss">
.benefit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16rpx;
}

.benefit-card {
  min-height: 292rpx;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.14);
  border-radius: 26rpx;
  background:
    radial-gradient(circle at 88% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    radial-gradient(circle at 0% 100%, rgba(64, 134, 255, 0.12), transparent 36%),
    rgba(10, 20, 42, 0.78);
  overflow: visible;
}

:deep(.benefit-icon) {
  width: 58rpx;
  height: 58rpx;
}

.benefit-title {
  margin-top: 18rpx;
  color: #fff1c2;
  font-size: 26rpx;
  font-weight: 900;
  line-height: 1.3;
}

.benefit-desc {
  margin-top: 8rpx;
  color: rgba(214, 229, 255, 0.68);
  font-size: 22rpx;
  line-height: 1.45;
}
</style>
