<script setup lang="ts">
import type { MatchItem } from '../services/types';
import { formatDateTime } from '../utils/date';

defineProps<{
  match: MatchItem;
}>();

const emit = defineEmits<{
  open: [id: string];
}>();
</script>

<template>
  <view class="card match-card" @tap="emit('open', match.id)">
    <view class="meta">{{ match.matchNo }} · {{ match.stage }} · {{ formatDateTime(match.kickoffAt) }}</view>
    <view class="teams">
      <text>{{ match.homeTeam.name }}</text>
      <text class="vs">VS</text>
      <text>{{ match.awayTeam.name }}</text>
    </view>
    <view class="meta">{{ match.venue || '待定场地' }} · {{ match.status }}</view>
  </view>
</template>

<style scoped lang="scss">
.match-card {
  display: grid;
  gap: 12rpx;
}

.teams {
  display: grid;
  grid-template-columns: 1fr 72rpx 1fr;
  align-items: center;
  text-align: center;
  font-size: 32rpx;
  font-weight: 700;
}

.vs {
  color: #0f766e;
  font-size: 24rpx;
}

.meta {
  color: #64748b;
  font-size: 24rpx;
}
</style>
