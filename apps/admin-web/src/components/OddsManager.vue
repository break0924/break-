<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import { createOdds, listMatches, listOdds } from '../api';
import type { MatchItem, OddsForm } from '../types/domain';

const loading = ref(false);
const matches = ref<MatchItem[]>([]);
const selectedMatchId = ref('');
const oddsRows = ref<Array<Record<string, unknown>>>([]);
const form = reactive<OddsForm>({
  market: 'WIN_DRAW_LOSE',
  selection: 'HOME_WIN',
  odds: '',
  source: 'admin-web'
});

const matchOptions = computed(() =>
  matches.value.map((match) => ({
    label: `${match.matchNo} ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    value: match.id
  }))
);

async function loadMatches() {
  matches.value = await listMatches();
  selectedMatchId.value ||= matches.value[0]?.id ?? '';
}

async function loadOdds() {
  if (!selectedMatchId.value) return;
  loading.value = true;
  try {
    oddsRows.value = await listOdds(selectedMatchId.value);
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!selectedMatchId.value || !form.odds) {
    ElMessage.warning('请选择比赛并填写赔率');
    return;
  }

  await createOdds(selectedMatchId.value, { ...form });
  ElMessage.success('赔率快照已保存');
  form.odds = '';
  await loadOdds();
}

watch(selectedMatchId, () => {
  void loadOdds();
});

onMounted(async () => {
  await loadMatches();
  await loadOdds();
});
</script>

<template>
  <el-card shadow="never">
    <template #header>赔率录入</template>
    <el-form :model="form" label-width="88px" class="form-grid">
      <el-form-item label="比赛">
        <el-select v-model="selectedMatchId" filterable>
          <el-option v-for="match in matchOptions" :key="match.value" :label="match.label" :value="match.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="玩法">
        <el-select v-model="form.market">
          <el-option label="胜平负" value="WIN_DRAW_LOSE" />
          <el-option label="让球胜平负" value="HANDICAP_WIN_DRAW_LOSE" />
          <el-option label="总进球" value="TOTAL_GOALS" />
          <el-option label="比分" value="SCORE" />
          <el-option label="半全场" value="HALF_FULL_TIME" />
        </el-select>
      </el-form-item>
      <el-form-item label="选项">
        <el-select v-model="form.selection">
          <el-option label="主胜" value="HOME_WIN" />
          <el-option label="平" value="DRAW" />
          <el-option label="客胜" value="AWAY_WIN" />
          <el-option label="让球主胜" value="HOME_HANDICAP_WIN" />
          <el-option label="让球平" value="HANDICAP_DRAW" />
          <el-option label="让球客胜" value="AWAY_HANDICAP_WIN" />
          <el-option label="总进球 0" value="TOTAL_0" />
          <el-option label="总进球 1" value="TOTAL_1" />
          <el-option label="总进球 2" value="TOTAL_2" />
          <el-option label="总进球 3" value="TOTAL_3" />
          <el-option label="总进球 4" value="TOTAL_4" />
          <el-option label="总进球 5" value="TOTAL_5" />
          <el-option label="总进球 6" value="TOTAL_6" />
          <el-option label="总进球 7+" value="TOTAL_7_PLUS" />
        </el-select>
      </el-form-item>
      <el-form-item label="赔率">
        <el-input v-model="form.odds" placeholder="2.1000" />
      </el-form-item>
      <el-form-item label="来源">
        <el-input v-model="form.source" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">保存赔率快照</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <el-card shadow="never" class="section-card">
    <template #header>赔率快照</template>
    <el-table :data="oddsRows" v-loading="loading" border>
      <el-table-column prop="market" label="玩法" min-width="170" />
      <el-table-column prop="selection" label="选项" min-width="160" />
      <el-table-column prop="odds" label="赔率" width="120" />
      <el-table-column prop="source" label="来源" width="140" />
      <el-table-column prop="isLatest" label="最新" width="90" />
      <el-table-column prop="capturedAt" label="快照时间" min-width="190" />
    </el-table>
  </el-card>
</template>
