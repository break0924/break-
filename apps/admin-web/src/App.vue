<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  DataAnalysis,
  Football,
  Medal,
  Operation,
  TrendCharts,
  UserFilled
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { clearToken, getToken, login, setToken } from './api';
import AiAnalysisManager from './components/AiAnalysisManager.vue';
import MatchManager from './components/MatchManager.vue';
import OddsManager from './components/OddsManager.vue';
import ResultManager from './components/ResultManager.vue';
import TeamManager from './components/TeamManager.vue';

type MenuKey = 'matches' | 'teams' | 'odds' | 'results' | 'analysis';

const loggedIn = ref(false);
const activeMenu = ref<MenuKey>('matches');
const loginForm = ref({
  username: 'admin',
  password: 'admin12345'
});

const activeTitle = computed(() => {
  const titles: Record<MenuKey, string> = {
    matches: '比赛管理',
    teams: '球队管理',
    odds: '赔率管理',
    results: '赛果录入',
    analysis: 'AI 分析内容管理'
  };
  return titles[activeMenu.value];
});

async function submitLogin() {
  try {
    const result = await login(loginForm.value.username, loginForm.value.password);
    setToken(result.accessToken);
    loggedIn.value = true;
    ElMessage.success('登录成功');
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '登录失败');
  }
}

function logout() {
  clearToken();
  loggedIn.value = false;
}

onMounted(() => {
  loggedIn.value = Boolean(getToken());
});
</script>

<template>
  <main v-if="!loggedIn" class="login-page">
    <el-card class="login-card" shadow="never">
      <template #header>
        <div class="login-title">世界杯竞彩助手后台</div>
      </template>
      <el-alert
        title="后台仅用于赛事、赔率、赛果和 AI 内容维护，不提供购买、充值、兑奖能力。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form :model="loginForm" label-position="top" class="login-form" @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="loginForm.username" autocomplete="username" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" autocomplete="current-password" show-password />
        </el-form-item>
        <el-button type="primary" class="full-button" @click="submitLogin">登录</el-button>
      </el-form>
    </el-card>
  </main>

  <el-container v-else class="admin-shell">
    <el-aside width="232px" class="sidebar">
      <div class="brand">
        <el-icon><Medal /></el-icon>
        <span>竞彩助手后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="menu"
        background-color="#111827"
        text-color="#cbd5e1"
        active-text-color="#ffffff"
        @select="(key: string) => (activeMenu = key as MenuKey)"
      >
        <el-menu-item index="matches">
          <el-icon><Football /></el-icon>
          <span>比赛管理</span>
        </el-menu-item>
        <el-menu-item index="teams">
          <el-icon><UserFilled /></el-icon>
          <span>球队管理</span>
        </el-menu-item>
        <el-menu-item index="odds">
          <el-icon><TrendCharts /></el-icon>
          <span>赔率管理</span>
        </el-menu-item>
        <el-menu-item index="results">
          <el-icon><Operation /></el-icon>
          <span>赛果录入</span>
        </el-menu-item>
        <el-menu-item index="analysis">
          <el-icon><DataAnalysis /></el-icon>
          <span>AI 分析内容管理</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div>
          <h1>{{ activeTitle }}</h1>
          <p>内容维护与审核，不涉及任何交易闭环。</p>
        </div>
        <el-button @click="logout">退出登录</el-button>
      </el-header>
      <el-main class="main">
        <el-alert
          class="risk-alert"
          title="合规提示：所有投注相关能力均为模拟和理论测算，不得表达购买、充值、兑奖或收益保证。"
          type="warning"
          :closable="false"
          show-icon
        />
        <MatchManager v-if="activeMenu === 'matches'" />
        <TeamManager v-if="activeMenu === 'teams'" />
        <OddsManager v-if="activeMenu === 'odds'" />
        <ResultManager v-if="activeMenu === 'results'" />
        <AiAnalysisManager v-if="activeMenu === 'analysis'" />
      </el-main>
    </el-container>
  </el-container>
</template>
