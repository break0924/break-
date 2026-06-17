<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { listMatches, updateMatchResult } from '../api';
import type { MatchItem, UpdateResultForm } from '../types/domain';

const loading = ref(false);
const matches = ref<MatchItem[]>([]);
const selectedMatchId = ref('');
const form = reactive<UpdateResultForm>({
  homeScore: 0,
  awayScore: 0,
  resultNote: '常规时间比分'
});

const selectedMatch = computed(() => matches.value.find((match) => match.id === selectedMatchId.value));
const matchOptions = computed(() =>
  matches.value.map((match) => ({
    label: `${match.matchNo} ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    value: match.id
  }))
);

async function load() {
  loading.value = true;
  try {
    matches.value = await listMatches();
    selectedMatchId.value ||= matches.value[0]?.id ?? '';
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!selectedMatchId.value) {
    ElMessage.warning('请选择比赛');
    return;
  }
  await updateMatchResult(selectedMatchId.value, { ...form });
  ElMessage.success('赛果已录入');
  await load();
}

function scoreText(row: MatchItem) {
  if (row.homeScore === undefined || row.awayScore === undefined) return '-';
  return `${row.homeScore}:${row.awayScore}`;
}

onMounted(load);
</script>

<template>
  <el-card shadow="never">
    <template #header>赛果录入</template>
    <el-form :model="form" label-width="88px" class="form-grid">
      <el-form-item label="比赛">
        <el-select v-model="selectedMatchId" filterable>
          <el-option v-for="match in matchOptions" :key="match.value" :label="match.label" :value="match.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="主队进球">
        <el-input-number v-model="form.homeScore" :min="0" />
      </el-form-item>
      <el-form-item label="客队进球">
        <el-input-number v-model="form.awayScore" :min="0" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.resultNote" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">保存赛果</el-button>
      </el-form-item>
    </el-form>
    <el-descriptions v-if="selectedMatch" :column="3" border class="result-preview">
      <el-descriptions-item label="主队">{{ selectedMatch.homeTeam.name }}</el-descriptions-item>
      <el-descriptions-item label="客队">{{ selectedMatch.awayTeam.name }}</el-descriptions-item>
      <el-descriptions-item label="当前状态">{{ selectedMatch.status }}</el-descriptions-item>
    </el-descriptions>
  </el-card>

  <el-card shadow="never" class="section-card">
    <template #header>赛果列表</template>
    <el-table :data="matches" v-loading="loading" border>
      <el-table-column prop="matchNo" label="编号" width="110" />
      <el-table-column label="对阵" min-width="200">
        <template #default="{ row }">{{ row.homeTeam.name }} vs {{ row.awayTeam.name }}</template>
      </el-table-column>
      <el-table-column label="比分" width="100">
        <template #default="{ row }">{{ scoreText(row) }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="130" />
      <el-table-column prop="resultNote" label="备注" min-width="160" />
    </el-table>
  </el-card>
</template>
