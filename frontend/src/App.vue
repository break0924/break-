<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app';
import { useAuthStore } from './stores/auth';
import { connectMatchMonitor } from './utils/match-monitor';

onLaunch(() => {
  useAuthStore().restore();
  connectMatchMonitor();
});
</script>

<style>
@import './styles.scss';
</style>
