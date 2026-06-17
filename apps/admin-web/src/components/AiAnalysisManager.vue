<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { ElMessage } from 'element-plus';
import {
  generateAnalysis,
  listAnalyses,
  listMatches,
  publishAnalysis,
  rejectAnalysis,
  updateAnalysis
} from '../api';
import type { AiAnalysis, MatchItem } from '../types/domain';

const loading = ref(false);
const matches = ref<MatchItem[]>([]);
const selectedMatchId = ref('');
const analyses = ref<AiAnalysis[]>([]);
const selectedAnalysisId = ref('');
const editForm = reactive<Partial<AiAnalysis>>({
  title: '',
  summary: '',
  tacticalNotes: '',
  injuryNotes: '',
  riskLevel: 'MEDIUM',
  confidence: '0.6000'
});

const matchOptions = computed(() =>
  matches.value.map((match) => ({
    label: `${match.matchNo} ${match.homeTeam.name} vs ${match.awayTeam.name}`,
    value: match.id
  }))
);

const selectedAnalysis = computed(() => analyses.value.find((item) => item.id === selectedAnalysisId.value));

async function loadMatches() {
  matches.value = await listMatches();
  selectedMatchId.value ||= matches.value[0]?.id ?? '';
}

async function loadAnalysesForMatch() {
  if (!selectedMatchId.value) return;
  loading.value = true;
  try {
    analyses.value = await listAnalyses(selectedMatchId.value);
    selectedAnalysisId.value = analyses.value[0]?.id ?? '';
    syncEditForm();
  } finally {
    loading.value = false;
  }
}

function syncEditForm() {
  const item = selectedAnalysis.value;
  Object.assign(editForm, {
    title: item?.title ?? '',
    summary: item?.summary ?? '',
    tacticalNotes: item?.tacticalNotes ?? '',
    injuryNotes: item?.injuryNotes ?? '',
    riskLevel: item?.riskLevel ?? 'MEDIUM',
    confidence: item?.confidence ?? '0.6000'
  });
}

async function generate() {
  if (!selectedMatchId.value) {
    ElMessage.warning('请选择比赛');
    return;
  }
  await generateAnalysis(selectedMatchId.value);
  ElMessage.success('AI 分析草稿已生成');
  await loadAnalysesForMatch();
}

async function save() {
  if (!selectedAnalysisId.value) {
    ElMessage.warning('请选择分析内容');
    return;
  }
  await updateAnalysis(selectedAnalysisId.value, editForm);
  ElMessage.success('分析内容已保存');
  await loadAnalysesForMatch();
}

async function publish() {
  if (!selectedAnalysisId.value) return;
  await publishAnalysis(selectedAnalysisId.value);
  ElMessage.success('分析已发布');
  await loadAnalysesForMatch();
}

async function reject() {
  if (!selectedAnalysisId.value) return;
  await rejectAnalysis(selectedAnalysisId.value);
  ElMessage.success('分析已驳回');
  await loadAnalysesForMatch();
}

watch(selectedMatchId, loadAnalysesForMatch);
watch(selectedAnalysisId, syncEditForm);

onMounted(async () => {
  await loadMatches();
  await loadAnalysesForMatch();
});
</script>

<template>
  <el-card shadow="never">
    <template #header>AI 分析内容管理</template>
    <div class="toolbar-row">
      <el-select v-model="selectedMatchId" filterable class="wide-select">
        <el-option v-for="match in matchOptions" :key="match.value" :label="match.label" :value="match.value" />
      </el-select>
      <el-button type="primary" @click="generate">生成待审核草稿</el-button>
      <el-button @click="loadAnalysesForMatch">刷新</el-button>
    </div>
  </el-card>

  <el-row :gutter="16" class="section-card">
    <el-col :span="10">
      <el-card shadow="never">
        <template #header>分析列表</template>
        <el-table :data="analyses" v-loading="loading" border highlight-current-row @current-change="(row?: AiAnalysis) => (selectedAnalysisId = row?.id ?? '')">
          <el-table-column prop="title" label="标题" min-width="150" />
          <el-table-column prop="status" label="状态" width="140">
            <template #default="{ row }">
              <el-tag :type="row.status === 'PUBLISHED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'">
                {{ row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="riskLevel" label="风险" width="100" />
        </el-table>
      </el-card>
    </el-col>
    <el-col :span="14">
      <el-card shadow="never">
        <template #header>编辑与审核</template>
        <el-form :model="editForm" label-width="88px">
          <el-form-item label="标题">
            <el-input v-model="editForm.title" />
          </el-form-item>
          <el-form-item label="摘要">
            <el-input v-model="editForm.summary" type="textarea" :rows="4" />
          </el-form-item>
          <el-form-item label="战术信息">
            <el-input v-model="editForm.tacticalNotes" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="伤停信息">
            <el-input v-model="editForm.injuryNotes" type="textarea" :rows="3" />
          </el-form-item>
          <el-form-item label="风险等级">
            <el-select v-model="editForm.riskLevel">
              <el-option label="低" value="LOW" />
              <el-option label="中" value="MEDIUM" />
              <el-option label="高" value="HIGH" />
            </el-select>
          </el-form-item>
          <el-form-item label="置信度">
            <el-input v-model="editForm.confidence" placeholder="0.6000" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="save">保存内容</el-button>
            <el-button type="success" @click="publish">发布</el-button>
            <el-button type="danger" @click="reject">驳回</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>
  </el-row>
</template>
