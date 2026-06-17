<template>
  <view class="match-visual">
    <view class="teams">
      <view class="team-side">
        <TeamFlag :team="match.homeTeam" />
        <view class="team-name">{{ match.homeTeam.name }}</view>
      </view>
      <view class="vs">VS</view>
      <view class="team-side right">
        <TeamFlag :team="match.awayTeam" />
        <view class="team-name">{{ match.awayTeam.name }}</view>
      </view>
    </view>

    <view class="visual-meta">
      <view>{{ time }}</view>
      <view v-if="confidence != null" class="confidence">AI信心 {{ confidence }}</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { Match } from '../../api/types';
import { formatKickoff } from '../../utils/format';
import TeamFlag from './TeamFlag.vue';

const props = defineProps<{
  match: Match;
  confidence?: number | string | null;
}>();

const time = computed(() => formatKickoff(props.match.kickoffAt));
</script>

<style scoped>
.match-visual {
  padding: 22rpx;
  border-radius: 14rpx;
  background:
    linear-gradient(135deg, rgba(25, 182, 127, 0.2), rgba(255, 255, 255, 0.06)),
    rgba(0, 0, 0, 0.16);
}

.teams {
  display: grid;
  grid-template-columns: 1fr 76rpx 1fr;
  align-items: center;
  gap: 14rpx;
}

.team-side {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}

.team-side.right {
  justify-content: flex-end;
}

.team-name {
  overflow: hidden;
  color: #f4fbf8;
  font-size: 28rpx;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.vs {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  color: #031711;
  background: #b8f6d8;
  font-size: 24rpx;
  font-weight: 900;
}

.visual-meta {
  display: flex;
  justify-content: space-between;
  gap: 16rpx;
  margin-top: 18rpx;
  color: #b8c9c3;
  font-size: 24rpx;
}

.confidence {
  color: #b8f6d8;
  font-weight: 800;
}
</style>
