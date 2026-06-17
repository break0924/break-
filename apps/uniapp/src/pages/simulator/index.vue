<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { getMatches } from '../../services/match';
import { createSimulationPlan } from '../../services/simulator';
import type { MatchItem } from '../../services/types';

const matches = ref<MatchItem[]>([]);
const matchIndex = ref(0);
const selectionIndex = ref(0);
const stake = ref('20.00');
const odds = ref('2.10');
const result = ref('');
const selections = ['HOME_WIN', 'DRAW', 'AWAY_WIN'];
const selectionLabels = ['主胜', '平', '客胜'];

const matchLabels = computed(() =>
  matches.value.map((match) => `${match.homeTeam.name} vs ${match.awayTeam.name}`)
);

async function loadMatches() {
  const result = await getMatches();
  matches.value = result.items;
}

async function submitPlan() {
  const match = matches.value[matchIndex.value];
  if (!match) {
    uni.showToast({ title: '暂无赛程数据', icon: 'none' });
    return;
  }

  const response = await createSimulationPlan({
    name: 'uni-app 模拟方案',
    stake: stake.value,
    multiple: 1,
    mode: 'SINGLE',
    riskNoticeAccepted: true,
    selections: [
      {
        matchId: match.id,
        market: 'WIN_DRAW_LOSE',
        selection: selections[selectionIndex.value],
        odds: odds.value
      }
    ]
  });

  result.value = response.estimatedPrizeMax;
}

onShow(() => {
  void loadMatches();
});
</script>

<template>
  <view class="page">
    <view class="risk">模拟方案仅保存演算参数，不是投注订单，不支持购买、充值或兑奖。</view>
    <view class="section-title">模拟方案</view>
    <view class="form">
      <text>比赛</text>
      <picker :range="matchLabels" @change="matchIndex = Number($event.detail.value)">
        <view class="picker">{{ matchLabels[matchIndex] || '暂无赛程' }}</view>
      </picker>
      <text>选择</text>
      <picker :range="selectionLabels" @change="selectionIndex = Number($event.detail.value)">
        <view class="picker">{{ selectionLabels[selectionIndex] }}</view>
      </picker>
      <text>模拟投入</text>
      <input v-model="stake" class="input" type="digit" />
      <text>赔率</text>
      <input v-model="odds" class="input" type="digit" />
      <button class="primary-btn" @tap="submitPlan">生成模拟方案</button>
    </view>
    <view v-if="result" class="card result">理论奖金：{{ result }}</view>
  </view>
</template>

<style scoped lang="scss">
.result {
  margin-top: 24rpx;
  font-weight: 700;
}
</style>
