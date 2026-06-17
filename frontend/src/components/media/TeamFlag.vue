<template>
  <view class="flag-wrap">
    <AppImage
      :src="src"
      :fallback="DEFAULT_FLAG"
      mode="aspectFill"
      custom-class="flag-image"
    />
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DEFAULT_FLAG, flagSrcForTeam } from '../../utils/assets';
import AppImage from './AppImage.vue';

const props = defineProps<{
  team?: {
    countryCode?: string | null;
    fifaCode?: string | null;
  } | null;
}>();

const src = computed(() => flagSrcForTeam(props.team || undefined));
</script>

<style scoped>
.flag-wrap {
  width: 76rpx;
  height: 52rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 255, 255, 0.18);
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.08);
}

.flag-image {
  width: 76rpx;
  height: 52rpx;
}
</style>
