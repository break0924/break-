<template>
  <image
    class="app-image"
    :class="customClass"
    :src="currentSrc"
    :mode="mode"
    :lazy-load="lazy"
    @error="handleError"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { DEFAULT_IMAGE } from '../../utils/assets';

const props = withDefaults(
  defineProps<{
    src?: string | null;
    fallback?: string;
    mode?: string;
    lazy?: boolean;
    customClass?: string;
  }>(),
  {
    src: '',
    fallback: DEFAULT_IMAGE,
    mode: 'aspectFill',
    lazy: true,
    customClass: '',
  },
);

const failed = ref(false);

watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);

const currentSrc = computed(() =>
  failed.value || !props.src ? props.fallback : props.src,
);

function handleError() {
  failed.value = true;
}
</script>

<style scoped>
.app-image {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
