<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import { createTeam, listTeams } from '../api';
import type { TeamForm, TeamItem } from '../types/domain';

const loading = ref(false);
const teams = ref<TeamItem[]>([]);
const form = reactive<TeamForm>({
  name: '',
  nameEn: '',
  fifaCode: '',
  groupName: '',
  flagUrl: ''
});

async function load() {
  loading.value = true;
  try {
    teams.value = await listTeams();
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!form.name) {
    ElMessage.warning('请输入球队中文名');
    return;
  }
  await createTeam({ ...form });
  ElMessage.success('球队已保存');
  Object.assign(form, { name: '', nameEn: '', fifaCode: '', groupName: '', flagUrl: '' });
  await load();
}

onMounted(load);
</script>

<template>
  <el-card shadow="never">
    <template #header>新增球队</template>
    <el-form :model="form" label-width="88px" class="form-grid">
      <el-form-item label="中文名">
        <el-input v-model="form.name" placeholder="阿根廷" />
      </el-form-item>
      <el-form-item label="英文名">
        <el-input v-model="form.nameEn" placeholder="Argentina" />
      </el-form-item>
      <el-form-item label="FIFA">
        <el-input v-model="form.fifaCode" placeholder="ARG" />
      </el-form-item>
      <el-form-item label="小组">
        <el-input v-model="form.groupName" placeholder="A" />
      </el-form-item>
      <el-form-item label="队旗 URL">
        <el-input v-model="form.flagUrl" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">保存球队</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <el-card shadow="never" class="section-card">
    <template #header>球队列表</template>
    <el-table :data="teams" v-loading="loading" border>
      <el-table-column prop="name" label="中文名" min-width="120" />
      <el-table-column prop="nameEn" label="英文名" min-width="140" />
      <el-table-column prop="fifaCode" label="FIFA" width="100" />
      <el-table-column prop="groupName" label="小组" width="100" />
    </el-table>
  </el-card>
</template>
