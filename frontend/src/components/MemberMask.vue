<template>
  <view v-if="locked" class="mask">
    <view class="mask-title">会员内容已锁定</view>
    <view class="mask-text">{{ hint || '开通世界杯通行证后查看完整分析' }}</view>
    <view class="btn" @tap="goMembership">开通会员</view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  locked?: boolean;
  hint?: string | null;
}>();

function goMembership() {
  uni.navigateTo({ url: '/pages/membership/index' });
}
</script>

<style scoped>
.mask {
  margin-top: 18rpx;
  padding: 28rpx;
  border-radius: 14rpx;
  background: rgba(4, 16, 13, 0.88);
  border: 1rpx solid rgba(184, 246, 216, 0.18);
  text-align: center;
}

.mask-title {
  font-size: 30rpx;
  font-weight: 800;
  color: #f4fbf8;
}

.mask-text {
  margin: 12rpx 0 22rpx;
  color: #a9bbb5;
  font-size: 24rpx;
  line-height: 1.5;
}
</style>
