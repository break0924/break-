<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createMatch, listMatches, listTeams } from '../api';
import type { MatchForm, MatchItem, TeamItem } from '../types/domain';

const loading = ref(false);
const teams = ref<TeamItem[]>([]);
const matches = ref<MatchItem[]>([]);
const form = reactive<MatchForm>({
  matchNo: '',
  stage: 'GROUP',
  groupName: '',
  kickoffAt: '',
  venue: '',
  homeTeamId: '',
  awayTeamId: ''
});

const teamOptions = computed(() => teams.value.map((team) => ({ label: team.name, value: team.id })));

async function load() {
  loading.value = true;
  try {
    const [teamList, matchList] = await Promise.all([listTeams(), listMatches()]);
    teams.value = teamList;
    matches.value = matchList;
    if (!form.homeTeamId && teamList[0]) form.homeTeamId = teamList[0].id;
    if (!form.awayTeamId && teamList[1]) form.awayTeamId = teamList[1].id;
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!form.matchNo || !form.kickoffAt || !form.homeTeamId || !form.awayTeamId) {
    ElMessage.warning('请完整填写比赛信息');
    return;
  }
  if (form.homeTeamId === form.awayTeamId) {
    ElMessage.warning('主队和客队不能相同');
    return;
  }

  await createMatch({
    ...form,
    kickoffAt: new Date(form.kickoffAt).toISOString()
  });
  ElMessage.success('比赛已保存');
  Object.assign(form, { matchNo: '', groupName: '', kickoffAt: '', venue: '' });
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
    <template #header>新增比赛</template>
    <el-form :model="form" label-width="88px" class="form-grid">
      <el-form-item label="比赛编号">
        <el-input v-model="form.matchNo" placeholder="WC-001" />
      </el-form-item>
      <el-form-item label="阶段">
        <el-select v-model="form.stage">
          <el-option label="小组赛" value="GROUP" />
          <el-option label="1/8 决赛" value="ROUND_OF_16" />
          <el-option label="1/4 决赛" value="QUARTER_FINAL" />
          <el-option label="半决赛" value="SEMI_FINAL" />
          <el-option label="决赛" value="FINAL" />
        </el-select>
      </el-form-item>
      <el-form-item label="小组">
        <el-input v-model="form.groupName" placeholder="A" />
      </el-form-item>
      <el-form-item label="开赛时间">
        <el-date-picker v-model="form.kickoffAt" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" />
      </el-form-item>
      <el-form-item label="比赛场地">
        <el-input v-model="form.venue" />
      </el-form-item>
      <el-form-item label="主队">
        <el-select v-model="form.homeTeamId">
          <el-option v-for="team in teamOptions" :key="team.value" :label="team.label" :value="team.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="客队">
        <el-select v-model="form.awayTeamId">
          <el-option v-for="team in teamOptions" :key="team.value" :label="team.label" :value="team.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">保存比赛</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <el-card shadow="never" class="section-card">
    <template #header>比赛列表</template>
    <el-table :data="matches" v-loading="loading" border>
      <el-table-column prop="matchNo" label="编号" width="110" />
      <el-table-column label="对阵" min-width="190">
        <template #default="{ row }">{{ row.homeTeam.name }} vs {{ row.awayTeam.name }}</template>
      </el-table-column>
      <el-table-column prop="stage" label="阶段" width="130" />
      <el-table-column prop="groupName" label="小组" width="90" />
      <el-table-column prop="kickoffAt" label="开赛时间" min-width="190" />
      <el-table-column prop="status" label="状态" width="130" />
      <el-table-column label="比分" width="100">
        <template #default="{ row }">{{ scoreText(row) }}</template>
      </el-table-column>
    </el-table>
  </el-card>
</template>
