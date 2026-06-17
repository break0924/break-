<template>
  <view class="reward-panel">
    <view class="reward-head">
      <view>
        <view class="reward-title">Top 10 荣誉奖励</view>
        <view class="reward-sub">世界杯结束后，积分榜前10名可获得专属荣誉与奖励</view>
      </view>
      <view class="reward-emblem">TOP10</view>
    </view>

    <view class="reward-list">
      <view
        v-for="tier in rewardConfig"
        :key="tier.rankLabel"
        class="reward-card"
        :class="{
          active: currentTier?.rankStart === tier.rankStart && currentTier?.rankEnd === tier.rankEnd,
          podium: tier.rankStart <= 3,
          compact: tier.rankStart > 3,
        }"
      >
        <view class="rank-line">
          <view class="rank-badge" :style="{ color: tier.highlightColor }">{{ tier.rankLabel }}</view>
          <view class="seat-badge">{{ tier.badge }}</view>
        </view>
        <view class="tier-title">{{ tier.title }}</view>
        <view class="reward-summary">
          <text
            v-for="reward in tier.rewards"
            :key="reward"
            class="reward-pill"
          >
            {{ reward }}
          </text>
        </view>
      </view>
    </view>

    <view class="rules-entry" @tap="$emit('rules')">
      <text>查看完整规则</text>
      <text class="arrow">›</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  getRewardTierByRank,
  rewardConfig,
} from '../../config/challengeRewards';

const props = defineProps<{
  currentRank?: number | null;
}>();

defineEmits<{
  rules: [];
}>();

const currentTier = computed(() => getRewardTierByRank(props.currentRank));
</script>

<style scoped lang="scss">
.reward-panel {
  padding: 26rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.14), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 20rpx 58rpx rgba(0, 0, 0, 0.22);
}

.reward-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  margin-bottom: 18rpx;
}

.reward-title {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.2;
}

.reward-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
  line-height: 1.45;
}

.reward-emblem {
  flex-shrink: 0;
  padding: 12rpx 16rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.26);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffd879;
  font-size: 21rpx;
  font-weight: 900;
}

.reward-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.reward-card {
  padding: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 90% 0%, rgba(255, 216, 130, 0.1), transparent 30%),
    rgba(255, 255, 255, 0.06);
}

.reward-card.podium {
  padding: 22rpx;
  border-color: rgba(255, 216, 130, 0.28);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.22), transparent 32%),
    linear-gradient(135deg, rgba(255, 216, 130, 0.13), rgba(64, 134, 255, 0.08));
  box-shadow: 0 14rpx 38rpx rgba(0, 0, 0, 0.16);
}

.reward-card.compact {
  border-radius: 20rpx;
  padding: 14rpx 16rpx;
}

.reward-card.active {
  border-color: rgba(255, 216, 130, 0.38);
  background:
    radial-gradient(circle at 90% 0%, rgba(255, 216, 130, 0.2), transparent 32%),
    rgba(255, 216, 130, 0.1);
  box-shadow: 0 0 34rpx rgba(255, 216, 130, 0.08);
}

.rank-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.rank-badge,
.seat-badge {
  font-size: 21rpx;
  font-weight: 900;
}

.podium .rank-badge {
  font-size: 25rpx;
}

.seat-badge {
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(221, 235, 255, 0.66);
}

.tier-title {
  margin-top: 10rpx;
  color: #ffffff;
  font-size: 27rpx;
  font-weight: 900;
}

.podium .tier-title {
  font-size: 32rpx;
}

.compact .tier-title {
  margin-top: 8rpx;
  font-size: 24rpx;
}

.reward-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 7rpx;
  margin-top: 8rpx;
}

.reward-pill {
  padding: 7rpx 11rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.08);
  color: rgba(255, 242, 199, 0.86);
  font-size: 20rpx;
  font-weight: 800;
  line-height: 1.28;
}

.compact .reward-pill {
  padding: 5rpx 9rpx;
  color: rgba(221, 235, 255, 0.68);
  font-size: 18rpx;
}

.rules-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.08);
  color: #fff1c2;
  font-size: 23rpx;
  font-weight: 900;
}

.arrow {
  font-size: 34rpx;
  line-height: 1;
}
</style>
