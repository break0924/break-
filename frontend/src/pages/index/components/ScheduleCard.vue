<template>
  <view class="schedule-card">
    <view class="time-block">
      <text class="time">{{ schedule.kickoffTime }}</text>
      <text class="group">{{ schedule.groupName }}</text>
    </view>
    <view class="schedule-match">
      <view class="side">
        <AppImage :src="schedule.homeFlag" :fallback="DEFAULT_FLAG" custom-class="flag" mode="aspectFill" />
        <text>{{ schedule.homeTeam }}</text>
      </view>
      <text class="vs">VS</text>
      <view class="side away">
        <AppImage :src="schedule.awayFlag" :fallback="DEFAULT_FLAG" custom-class="flag" mode="aspectFill" />
        <text>{{ schedule.awayTeam }}</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import AppImage from '../../../components/media/AppImage.vue';
import { DEFAULT_FLAG } from '../../../utils/assets';
import type { ScheduleMock } from '../mock';

defineProps<{
  schedule: ScheduleMock;
}>();
</script>

<style scoped lang="scss">
.schedule-card {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 12rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 20rpx;
  background: rgba(10, 20, 42, 0.52);
}

.time-block {
  display: flex;
  width: 92rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10rpx 8rpx;
  border-radius: 16rpx;
  background: rgba(255, 216, 130, 0.1);
}

.time {
  color: #ffd879;
  font-size: 31rpx;
  font-weight: 900;
}

.group {
  margin-top: 4rpx;
  color: rgba(221, 235, 255, 0.46);
  font-size: 17rpx;
}

.schedule-match {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 12rpx;
}

.side {
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
  gap: 8rpx;
  color: rgba(247, 251, 255, 0.86);
  font-size: 23rpx;
  font-weight: 800;
}

.side.away {
  justify-content: flex-end;
  text-align: right;
}

:deep(.flag) {
  width: 52rpx;
  height: 36rpx;
  border-radius: 8rpx;
}

.vs {
  flex-shrink: 0;
  color: rgba(255, 255, 255, 0.24);
  font-size: 17rpx;
  font-weight: 900;
}
</style>
