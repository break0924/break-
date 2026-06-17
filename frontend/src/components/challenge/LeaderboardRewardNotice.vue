<template>
  <view class="leaderboard-reward">
    <view class="notice-head">
      <view>
        <view class="notice-title">Top 10 荣誉奖励</view>
        <view class="notice-sub">世界杯挑战赛结束后，积分榜前10名将获得专属荣誉与奖励</view>
      </view>
      <view v-if="status.qualified" class="current-badge">当前档位</view>
    </view>

    <view class="status-card" :class="{ qualified: status.qualified }">
      {{ status.message }}
    </view>

    <view class="podium-rewards">
      <view
        v-for="tier in podiumRewards"
        :key="tier.rankLabel"
        class="reward-card podium"
        :class="{ active: status.tier?.rankStart === tier.rankStart && status.tier?.rankEnd === tier.rankEnd }"
      >
        <view class="rank-line">
          <text class="rank" :style="{ color: tier.highlightColor }">{{ tier.rankLabel }}</text>
          <text class="seat">{{ tier.badge }}</text>
        </view>
        <view class="title">{{ tier.title }}</view>
        <view class="desc">{{ tier.rewards.slice(0, 3).join(' · ') }}</view>
      </view>
    </view>

    <view class="compact-rewards">
      <view
        v-for="tier in compactRewards"
        :key="tier.rankLabel"
        class="compact-row"
        :class="{ active: status.tier?.rankStart === tier.rankStart && status.tier?.rankEnd === tier.rankEnd }"
      >
        <text>{{ tier.rankLabel }}</text>
        <text>{{ tier.title }}</text>
      </view>
    </view>

    <view class="rules-entry" @tap="expanded = !expanded">
      <text>{{ expanded ? '收起完整规则' : '查看完整规则' }}</text>
      <text class="arrow">{{ expanded ? '⌃' : '›' }}</text>
    </view>

    <view v-if="expanded" class="rules-box">
      <view
        v-for="rule in challengeRules"
        :key="rule"
        class="rule-line"
      >
        {{ rule }}
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import {
  challengeRules,
  getLeaderboardRewardStatus,
  rewardConfig,
} from '../../config/challengeRewards';

const props = defineProps<{
  currentRank?: number | null;
}>();

const expanded = ref(false);
const status = computed(() => getLeaderboardRewardStatus(props.currentRank));
const podiumRewards = computed(() => rewardConfig.slice(0, 3));
const compactRewards = computed(() => rewardConfig.slice(3));
</script>

<style scoped lang="scss">
.leaderboard-reward {
  position: relative;
  z-index: 1;
  margin-top: 26rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 20rpx 58rpx rgba(0, 0, 0, 0.22);
}

.notice-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.notice-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.notice-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
  line-height: 1.45;
}

.current-badge {
  flex-shrink: 0;
  padding: 9rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.12);
  color: #ffd879;
  font-size: 20rpx;
  font-weight: 900;
}

.status-card {
  margin-top: 14rpx;
  padding: 14rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(221, 235, 255, 0.68);
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.45;
}

.status-card.qualified {
  border-color: rgba(255, 216, 130, 0.24);
  background: rgba(255, 216, 130, 0.1);
  color: #fff1c2;
}

.podium-rewards {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 14rpx;
}

.reward-card {
  padding: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.05);
}

.reward-card.podium {
  border-color: rgba(255, 216, 130, 0.22);
  background:
    radial-gradient(circle at 94% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(255, 255, 255, 0.055);
}

.reward-card.active,
.compact-row.active {
  border-color: rgba(255, 216, 130, 0.34);
  background: rgba(255, 216, 130, 0.1);
}

.rank-line,
.compact-row,
.rules-entry {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.rank {
  font-size: 22rpx;
  font-weight: 900;
}

.seat {
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(221, 235, 255, 0.66);
  font-size: 19rpx;
  font-weight: 900;
}

.title {
  margin-top: 8rpx;
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 900;
}

.desc {
  margin-top: 6rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 19rpx;
  line-height: 1.4;
}

.compact-rewards {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  margin-top: 12rpx;
}

.compact-row {
  padding: 13rpx 15rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.04);
}

.compact-row text:first-child {
  color: #ffd879;
  font-size: 20rpx;
  font-weight: 900;
}

.compact-row text:last-child {
  color: rgba(221, 235, 255, 0.72);
  font-size: 20rpx;
  font-weight: 850;
}

.rules-entry {
  margin-top: 14rpx;
  padding: 15rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.08);
  color: #fff1c2;
  font-size: 23rpx;
  font-weight: 900;
}

.arrow {
  font-size: 30rpx;
  line-height: 1;
}

.rules-box {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 16rpx;
}

.rule-line {
  padding: 14rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 15rpx;
  background: rgba(255, 255, 255, 0.04);
  color: rgba(221, 235, 255, 0.66);
  font-size: 20rpx;
  line-height: 1.42;
}
</style>
