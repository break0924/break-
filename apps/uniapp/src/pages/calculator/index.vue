<script setup lang="ts">
import { ref } from 'vue';
import { calculatePrize } from '../../services/calculator';

const stake = ref('20.00');
const odds = ref('2.10');
const multiple = ref('1');
const result = ref('');

async function calculate() {
  const response = await calculatePrize({
    stake: stake.value,
    multiple: Number(multiple.value || 1),
    mode: 'SINGLE',
    selections: [
      {
        market: 'WIN_DRAW_LOSE',
        selection: 'HOME_WIN',
        odds: odds.value
      }
    ]
  });

  result.value = response.estimatedPrizeMax;
}
</script>

<template>
  <view class="page">
    <view class="risk">理论奖金计算器只做公式演算，不代表真实可兑奖金额。</view>
    <view class="section-title">奖金计算器</view>
    <view class="form">
      <text>模拟投入</text>
      <input v-model="stake" class="input" type="digit" />
      <text>赔率</text>
      <input v-model="odds" class="input" type="digit" />
      <text>倍数</text>
      <input v-model="multiple" class="input" type="number" />
      <button class="primary-btn" @tap="calculate">计算理论奖金</button>
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
