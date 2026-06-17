<template>
  <view class="schedule-page">
    <view class="schedule-hero">
      <view class="hero-copy">
        <view class="eyebrow">Match Center</view>
        <view class="h1">2026 世界杯赛程</view>
        <view class="sub">按日期查看全部比赛安排、状态与重点预测</view>
      </view>
      <view class="hero-actions">
        <view class="hero-btn primary" @tap="goOverview">赛程总览</view>
        <view class="hero-btn ghost" @tap="openPoster('today')">今日海报</view>
      </view>
    </view>

    <view class="quick-tabs">
      <view
        v-for="tab in quickTabs"
        :key="tab.value"
        class="quick-tab"
        :class="{ active: activeQuick === tab.value }"
        @tap="selectQuick(tab.value)"
      >
        <text>{{ tab.label }}</text>
        <text class="quick-count">{{ countByQuick(tab.value) }}</text>
      </view>
    </view>

    <view class="filter-shell">
      <scroll-view scroll-x class="stage-scroll">
        <view class="filter-row">
          <view
            class="stage-chip"
            :class="{ active: !selectedStage }"
            @tap="selectStage('')"
          >
            全部阶段
          </view>
          <view
            v-for="stage in stageOptions"
            :key="stage.value"
            class="stage-chip"
            :class="{ active: selectedStage === stage.value }"
            @tap="selectStage(stage.value)"
          >
            {{ stage.label }}
          </view>
        </view>
      </scroll-view>

      <scroll-view scroll-x class="group-scroll">
        <view class="group-row">
          <view
            class="group-chip"
            :class="{ active: !selectedGroup }"
            @tap="selectGroup('')"
          >
            全部小组
          </view>
          <view
            v-for="group in groupOptions"
            :key="group"
            class="group-chip"
            :class="{ active: selectedGroup === group }"
            @tap="selectGroup(group)"
          >
            {{ normalizeGroupName(group) }}
          </view>
        </view>
      </scroll-view>
    </view>

    <view class="poster-tools">
      <view class="tool-btn" @tap="openPoster('today')">今日赛程海报</view>
      <view class="tool-btn" @tap="openPoster('date')">当前分组海报</view>
      <view class="tool-btn" @tap="openPoster('group-overview')">小组赛总览</view>
    </view>

    <view class="content-head">
      <view>
        <view class="section-title">{{ contentTitle }}</view>
        <view class="section-sub">{{ contentSubtitle }}</view>
      </view>
      <view class="result-count">{{ filteredMatches.length }} 场</view>
    </view>

    <view v-if="loading" class="state-card">赛程加载中...</view>
    <view v-else-if="error" class="state-card">
      <view class="state-title">加载失败</view>
      <view class="state-sub">{{ error }}</view>
      <view class="state-btn" @tap="loadMatches">重试</view>
    </view>
    <view v-else-if="groupedMatches.length === 0" class="state-card">
      <view class="state-title">暂无赛程</view>
      <view class="state-sub">当前筛选条件下没有比赛，可以切换到全部或未开始查看。</view>
      <view class="state-btn" @tap="selectQuick('ALL')">查看全部赛程</view>
    </view>

    <view v-else class="date-groups">
      <view
        v-for="group in groupedMatches"
        :key="group.date"
        class="date-group"
      >
        <view class="date-header">
          <view>
            <view class="date-title">{{ group.label }}</view>
            <view class="date-sub">{{ group.matches.length }} 场比赛</view>
          </view>
          <view class="date-badge">{{ group.badge }}</view>
        </view>

        <view class="match-list">
          <view
            v-for="match in group.matches"
            :key="match.id"
            class="match-row"
            :class="rowClass(match)"
            @tap="goMatch(match.id)"
          >
            <view class="time-block">
              <view class="time">{{ match.kickoffTime || toLocalTime(match.kickoffAt) }}</view>
              <view class="stage">{{ compactStageLabel(match) }}</view>
            </view>

            <view class="versus-block">
              <view class="team-line">
                <TeamFlag :team="match.homeTeam" />
                <view class="team-name">{{ match.homeTeam.name }}</view>
              </view>
              <view class="versus-mid">
                <view v-if="isFinished(match)" class="score-result">
                  <view class="score-label">赛果</view>
                  <view class="score">{{ resultText(match) }}</view>
                </view>
                <view v-else class="vs">VS</view>
              </view>
              <view class="team-line right">
                <TeamFlag :team="match.awayTeam" />
                <view class="team-name">{{ match.awayTeam.name }}</view>
              </view>
            </view>

            <view class="row-side">
              <view class="status-tag" :class="statusClass(match)">
                {{ statusLabel(match) }}
              </view>
              <view v-if="isUpcoming(match)" class="row-actions">
                <view class="mini-action" @tap.stop="goPrediction(match)">去看预测</view>
                <view class="mini-action ghost" @tap.stop="goChallenge(match)">去参与挑战</view>
              </view>
              <view v-else-if="isFinished(match)" class="archive-link" @tap.stop="goArchive(match)">
                查看归档分析
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <SchedulePosterCanvas
      :visible="posterVisible"
      :mode="posterMode"
      :title="posterTitle"
      :date-label="posterDateLabel"
      :matches="posterMatches"
      @close="posterVisible = false"
    />
  </view>
</template>

<script setup lang="ts">
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import { computed, onMounted, ref } from 'vue';
import { api } from '../../api';
import type { Match, TournamentStage } from '../../api/types';
import SchedulePosterCanvas from '../../components/SchedulePosterCanvas.vue';
import TeamFlag from '../../components/media/TeamFlag.vue';
import { matchStatusClass, matchStatusLabel, normalizeMatchStatus } from '../../utils/format';

type QuickFilter = 'ALL' | 'TODAY' | 'TOMORROW' | 'UPCOMING' | 'FINISHED';

type DateGroup = {
  date: string;
  label: string;
  badge: string;
  matches: Match[];
};

const quickTabs: Array<{ label: string; value: QuickFilter }> = [
  { label: '全部', value: 'ALL' },
  { label: '今日', value: 'TODAY' },
  { label: '明日', value: 'TOMORROW' },
  { label: '未开始', value: 'UPCOMING' },
  { label: '已结束', value: 'FINISHED' },
];

const stageOptions: Array<{ label: string; value: TournamentStage }> = [
  { label: '小组赛', value: 'GROUP' },
  { label: '32强', value: 'ROUND_OF_32' },
  { label: '16强', value: 'ROUND_OF_16' },
  { label: '8强', value: 'QUARTER_FINAL' },
  { label: '半决赛', value: 'SEMI_FINAL' },
  { label: '决赛', value: 'FINAL' },
];

const fallbackGroups = 'ABCDEFGHIJKL'.split('');
const APP_TIMEZONE = 'Asia/Shanghai';
const today = getTodayDate();
const tomorrow = addDays(today, 1);

const loading = ref(false);
const error = ref('');
const allMatches = ref<Match[]>([]);
const filterGroups = ref<string[]>([]);
const activeQuick = ref<QuickFilter>('TODAY');
const selectedGroup = ref('');
const selectedStage = ref<TournamentStage | ''>('');
const initialized = ref(false);
const posterVisible = ref(false);
const posterMode = ref<'today' | 'date' | 'group-overview'>('today');
const posterTitle = ref('今日赛程海报');
const posterDateLabel = ref('');
const posterMatches = ref<Match[]>([]);

const groupOptions = computed(() =>
  filterGroups.value.length > 0 ? filterGroups.value : fallbackGroups,
);

const filteredMatches = computed(() =>
  allMatches.value
    .filter((match) => quickFilterMatch(match, activeQuick.value))
    .filter((match) => !selectedStage.value || match.stage === selectedStage.value)
    .filter((match) => {
      if (!selectedGroup.value) {
        return true;
      }
      return (
        match.groupName === selectedGroup.value ||
        match.groupName === `${selectedGroup.value}组`
      );
    })
    .sort(compareKickoff),
);

const groupedMatches = computed<DateGroup[]>(() => {
  const map = new Map<string, Match[]>();
  for (const match of filteredMatches.value) {
    const date = matchDateOnly(match);
    map.set(date, [...(map.get(date) || []), match]);
  }

  return Array.from(map.entries()).map(([date, matches]) => ({
    date,
    label: `${formatDateLabel(date)} ${weekdayLabel(date)}`,
    badge: date === today ? '今日' : date === tomorrow ? '明日' : stageDayBadge(matches),
    matches,
  }));
});

const contentTitle = computed(() => {
  const hit = quickTabs.find((item) => item.value === activeQuick.value);
  return hit ? `${hit.label}赛程` : '赛程列表';
});

const contentSubtitle = computed(() => {
  if (activeQuick.value === 'UPCOMING') {
    return '只展示尚未开赛的比赛，适合查看预测和参与挑战';
  }
  if (activeQuick.value === 'FINISHED') {
    return '已结束比赛展示赛果和归档分析入口';
  }
  if (activeQuick.value === 'ALL') {
    return '完整赛程已按日期分组，适合快速查找';
  }
  return '按开赛时间排列，赛前内容持续更新';
});

onMounted(init);
onShow(init);

onShareAppMessage(() => ({
  title: '2026世界杯赛程中心',
  path: '/pages/schedule/index',
}));

async function init() {
  if (initialized.value) {
    return;
  }

  initialized.value = true;
  await loadFilters();
  await loadMatches();
  applyDefaultQuickFilter();
}

async function loadFilters() {
  try {
    const filters = await api.matchFilters();
    filterGroups.value = filters.groups?.length ? filters.groups : fallbackGroups;
  } catch {
    filterGroups.value = fallbackGroups;
  }
}

async function loadMatches() {
  loading.value = true;
  error.value = '';
  try {
    allMatches.value = await api.matches();
  } catch (err) {
    allMatches.value = [];
    error.value = err instanceof Error ? err.message : '网络异常，请稍后重试';
  } finally {
    loading.value = false;
  }
}

function applyDefaultQuickFilter() {
  if (allMatches.value.some((match) => matchDateOnly(match) === today)) {
    activeQuick.value = 'TODAY';
    return;
  }

  if (allMatches.value.some((match) => isUpcoming(match))) {
    activeQuick.value = 'UPCOMING';
    return;
  }

  activeQuick.value = 'ALL';
}

function selectQuick(value: QuickFilter) {
  activeQuick.value = value;
}

function selectGroup(group: string) {
  selectedGroup.value = group;
}

function selectStage(stage: TournamentStage | '') {
  selectedStage.value = stage;
}

function countByQuick(value: QuickFilter) {
  return allMatches.value.filter((match) => quickFilterMatch(match, value)).length;
}

function quickFilterMatch(match: Match, filter: QuickFilter) {
  if (filter === 'ALL') {
    return true;
  }
  if (filter === 'TODAY') {
    return matchDateOnly(match) === today;
  }
  if (filter === 'TOMORROW') {
    return matchDateOnly(match) === tomorrow;
  }
  if (filter === 'UPCOMING') {
    return isUpcoming(match);
  }
  return isFinished(match);
}

function isUpcoming(match: Match) {
  return normalizeMatchStatus(match.status) === 'SCHEDULED' && isFutureKickoff(match);
}

function isFinished(match: Match) {
  if (normalizeMatchStatus(match.status) === 'FINISHED') {
    return true;
  }

  return hasResult(match) && !isFutureKickoff(match);
}

function rowClass(match: Match) {
  return {
    finished: isFinished(match),
    live: normalizeMatchStatus(match.status) === 'LIVE' || isPendingResult(match),
    upcoming: isUpcoming(match),
  };
}

function goMatch(id: string) {
  uni.navigateTo({ url: `/pages/match-detail/index?id=${id}` });
}

function goPrediction(match: Match) {
  uni.navigateTo({ url: `/pages/match-detail/index?id=${match.id}` });
}

function goChallenge(match: Match) {
  uni.navigateTo({ url: `/pages/prediction-submit/index?matchId=${match.id}` });
}

function goArchive(match: Match) {
  uni.navigateTo({ url: `/pages/match-detail/index?id=${match.id}` });
}

function goOverview() {
  uni.navigateTo({ url: '/pages/schedule/overview' });
}

async function openPoster(mode: 'today' | 'date' | 'group-overview') {
  posterMode.value = mode;
  posterVisible.value = false;

  try {
    if (mode === 'today') {
      posterTitle.value = '今日赛程海报';
      posterDateLabel.value = formatDateLabel(today);
      posterMatches.value = allMatches.value.filter((match) => matchDateOnly(match) === today);
    } else if (mode === 'date') {
      const date = groupedMatches.value[0]?.date || today;
      posterTitle.value = '当前赛程海报';
      posterDateLabel.value = formatDateLabel(date);
      posterMatches.value = filteredMatches.value;
    } else {
      posterTitle.value = '小组赛总览海报';
      posterDateLabel.value = '2026世界杯小组赛';
      posterMatches.value = allMatches.value.filter((match) => match.stage === 'GROUP');
    }

    posterVisible.value = true;
  } catch {
    posterMatches.value = filteredMatches.value;
    posterVisible.value = true;
    uni.showToast({ title: '已使用当前页面赛程生成', icon: 'none' });
  }
}

function normalizeGroupName(value: string) {
  return value.endsWith('组') ? value : `${value}组`;
}

function compactStageLabel(match: Match) {
  const stage = stageLabel(match.stage);
  return match.groupName ? `${normalizeGroupName(match.groupName)} · ${stage}` : stage;
}

function resultText(match: Match) {
  if (match.homeScore === null || match.homeScore === undefined) {
    return '赛果';
  }
  if (match.awayScore === null || match.awayScore === undefined) {
    return '赛果';
  }
  return `${match.homeScore}-${match.awayScore}`;
}

function compareKickoff(a: Match, b: Match) {
  return new Date(a.kickoffAt).getTime() - new Date(b.kickoffAt).getTime();
}

function matchDateOnly(match: Match) {
  return match.matchDate ? match.matchDate.slice(0, 10) : toShanghaiDate(match.kickoffAt);
}

function formatDateLabel(value: string) {
  const [, month, day] = value.split('-');
  return `${Number(month)}月${Number(day)}日`;
}

function weekdayLabel(value: string) {
  const labels = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const date = new Date(`${value}T00:00:00+08:00`);
  return labels[date.getDay()];
}

function stageDayBadge(matches: Match[]) {
  const hasUpcoming = matches.some((match) => isUpcoming(match));
  const hasFinished = matches.every((match) => isFinished(match));
  if (hasUpcoming) {
    return '可预测';
  }
  if (hasFinished) {
    return '已归档';
  }
  return '赛程';
}

function toShanghaiDate(value: string | Date) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((item) => item.type === 'year')?.value || '2026';
  const month = parts.find((item) => item.type === 'month')?.value || '01';
  const day = parts.find((item) => item.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

function toLocalTime(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: APP_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const hour = parts.find((item) => item.type === 'hour')?.value || '00';
  const minute = parts.find((item) => item.type === 'minute')?.value || '00';
  return `${hour}:${minute}`;
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00+08:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function stageLabel(stage: string) {
  const hit = stageOptions.find((item) => item.value === stage);
  if (hit) {
    return hit.label;
  }

  const map: Record<string, string> = {
    THIRD_PLACE: '三四名决赛',
  };
  return map[stage] || stage;
}

function statusLabel(match: Match) {
  if (isPendingResult(match)) {
    return '待赛果';
  }
  return matchStatusLabel(normalizeMatchStatus(match.status));
}

function statusClass(match: Match) {
  if (isPendingResult(match)) {
    return { live: true };
  }
  return matchStatusClass(normalizeMatchStatus(match.status));
}

function getTodayDate() {
  return toShanghaiDate(new Date());
}

function hasResult(match: Match) {
  return match.homeScore !== null &&
    match.homeScore !== undefined &&
    match.awayScore !== null &&
    match.awayScore !== undefined;
}

function isFutureKickoff(match: Match) {
  return new Date(match.kickoffAt).getTime() > Date.now();
}

function isPendingResult(match: Match) {
  return normalizeMatchStatus(match.status) === 'SCHEDULED' &&
    !isFutureKickoff(match) &&
    !hasResult(match);
}
</script>

<style scoped>
.schedule-page {
  min-height: 100vh;
  padding: 28rpx 24rpx 52rpx;
  box-sizing: border-box;
  color: #f4f8ff;
  background:
    radial-gradient(circle at 18% 0%, rgba(56, 142, 255, 0.26), transparent 34%),
    radial-gradient(circle at 88% 12%, rgba(247, 183, 49, 0.2), transparent 28%),
    linear-gradient(180deg, #07152e 0%, #07101f 45%, #050911 100%);
}

.schedule-hero {
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: space-between;
  gap: 20rpx;
  padding: 34rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 28rpx;
  background:
    linear-gradient(135deg, rgba(22, 55, 120, 0.94), rgba(10, 16, 36, 0.96)),
    linear-gradient(90deg, rgba(245, 196, 85, 0.16), transparent);
  box-shadow: 0 22rpx 60rpx rgba(0, 0, 0, 0.32);
}

.schedule-hero::after {
  content: '';
  position: absolute;
  right: -70rpx;
  top: -80rpx;
  width: 230rpx;
  height: 230rpx;
  border: 2rpx solid rgba(255, 215, 128, 0.24);
  border-radius: 50%;
}

.hero-copy,
.hero-actions {
  position: relative;
  z-index: 1;
}

.eyebrow {
  color: #ffd98a;
  font-size: 22rpx;
  font-weight: 800;
  text-transform: uppercase;
}

.h1 {
  margin-top: 10rpx;
  color: #ffffff;
  font-size: 44rpx;
  font-weight: 950;
}

.sub {
  margin-top: 12rpx;
  color: rgba(229, 238, 255, 0.76);
  font-size: 24rpx;
  line-height: 1.45;
}

.hero-actions {
  flex: 0 0 170rpx;
  display: flex;
  flex-direction: column;
  gap: 14rpx;
  align-items: stretch;
  justify-content: center;
}

.hero-btn {
  height: 58rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 850;
}

.hero-btn.primary {
  color: #10141e;
  background: linear-gradient(135deg, #ffdd7a, #f4ae2f);
}

.hero-btn.ghost {
  color: #dfeaff;
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  background: rgba(255, 255, 255, 0.08);
}

.quick-tabs {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10rpx;
  margin-top: 24rpx;
  padding: 8rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(4, 10, 24, 0.62);
}

.quick-tab {
  min-width: 0;
  height: 70rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  border-radius: 18rpx;
  color: rgba(222, 232, 255, 0.68);
  font-size: 22rpx;
  font-weight: 760;
}

.quick-tab.active {
  color: #10141e;
  background: linear-gradient(135deg, #ffe08a, #f7b63d);
  box-shadow: 0 12rpx 30rpx rgba(245, 179, 63, 0.2);
}

.quick-count {
  font-size: 18rpx;
  opacity: 0.78;
}

.filter-shell {
  margin-top: 22rpx;
  padding: 18rpx 0;
  border-top: 1rpx solid rgba(255, 255, 255, 0.08);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.stage-scroll,
.group-scroll {
  width: 100%;
  white-space: nowrap;
}

.group-scroll {
  margin-top: 14rpx;
}

.filter-row,
.group-row {
  display: inline-flex;
  gap: 12rpx;
  min-width: 100%;
}

.stage-chip,
.group-chip {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  color: rgba(229, 238, 255, 0.72);
  background: rgba(255, 255, 255, 0.06);
}

.stage-chip {
  height: 58rpx;
  padding: 0 24rpx;
  font-size: 23rpx;
  font-weight: 780;
}

.group-chip {
  height: 48rpx;
  padding: 0 18rpx;
  font-size: 21rpx;
}

.stage-chip.active,
.group-chip.active {
  color: #f8dc91;
  border-color: rgba(248, 218, 145, 0.55);
  background: rgba(248, 186, 62, 0.14);
}

.poster-tools {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 18rpx;
}

.tool-btn {
  min-height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 18rpx;
  color: rgba(232, 240, 255, 0.82);
  background: rgba(255, 255, 255, 0.06);
  font-size: 21rpx;
  font-weight: 760;
  text-align: center;
  box-sizing: border-box;
}

.content-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 30rpx;
}

.section-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.section-sub {
  margin-top: 8rpx;
  color: rgba(222, 232, 255, 0.58);
  font-size: 22rpx;
}

.result-count {
  flex: 0 0 auto;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  color: #f8dc91;
  background: rgba(248, 186, 62, 0.14);
  font-size: 22rpx;
  font-weight: 850;
}

.state-card {
  margin-top: 22rpx;
  padding: 36rpx 28rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  color: rgba(229, 238, 255, 0.74);
  background: rgba(255, 255, 255, 0.06);
  text-align: center;
}

.state-title {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.state-sub {
  margin-top: 10rpx;
  font-size: 23rpx;
  line-height: 1.5;
}

.state-btn {
  width: 220rpx;
  height: 62rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 24rpx auto 0;
  border-radius: 999rpx;
  color: #10141e;
  background: linear-gradient(135deg, #ffdd7a, #f4ae2f);
  font-size: 24rpx;
  font-weight: 850;
}

.date-groups {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  margin-top: 20rpx;
}

.date-group {
  padding: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 26rpx;
  background: rgba(6, 14, 32, 0.72);
}

.date-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 14rpx;
}

.date-title {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
}

.date-sub {
  margin-top: 4rpx;
  color: rgba(222, 232, 255, 0.54);
  font-size: 21rpx;
}

.date-badge {
  flex: 0 0 auto;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  color: #10141e;
  background: #f8d56d;
  font-size: 21rpx;
  font-weight: 850;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.match-row {
  display: grid;
  grid-template-columns: 92rpx minmax(0, 1fr) 160rpx;
  align-items: center;
  gap: 16rpx;
  min-height: 112rpx;
  padding: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 20rpx;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.035));
  box-sizing: border-box;
}

.match-row.live {
  border-color: rgba(102, 205, 255, 0.42);
}

.match-row.finished {
  opacity: 0.78;
}

.time-block {
  min-width: 0;
}

.time {
  color: #f8dc91;
  font-size: 28rpx;
  font-weight: 950;
}

.stage {
  margin-top: 5rpx;
  color: rgba(222, 232, 255, 0.52);
  font-size: 18rpx;
  line-height: 1.25;
}

.versus-block {
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 74rpx minmax(0, 1fr);
  align-items: center;
  gap: 10rpx;
}

.team-line {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.team-line.right {
  flex-direction: row-reverse;
  text-align: right;
}

.team-name {
  min-width: 0;
  color: #f7fbff;
  font-size: 25rpx;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.versus-mid {
  display: flex;
  align-items: center;
  justify-content: center;
}

.vs {
  color: rgba(222, 232, 255, 0.42);
  font-size: 20rpx;
  font-weight: 900;
}

.score {
  min-width: 64rpx;
  height: 44rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14rpx;
  color: #111827;
  background: rgba(248, 213, 109, 0.94);
  font-size: 23rpx;
  font-weight: 950;
}

.score-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.score-label {
  color: rgba(222, 232, 255, 0.56);
  font-size: 17rpx;
  font-weight: 800;
  line-height: 1;
}

.row-side {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10rpx;
}

.status-tag {
  flex: 0 0 auto;
  padding: 7rpx 13rpx;
  border-radius: 999rpx;
  color: #f7fbff;
  background: rgba(255, 255, 255, 0.1);
  font-size: 20rpx;
  font-weight: 850;
}

.status-tag.live {
  color: #082033;
  background: #7bd9ff;
}

.status-tag.finished {
  color: rgba(232, 240, 255, 0.66);
  background: rgba(255, 255, 255, 0.08);
}

.status-tag.postponed,
.status-tag.cancelled {
  color: #2a130a;
  background: #ffd0a6;
}

.row-actions {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
  align-items: flex-end;
}

.mini-action,
.archive-link {
  min-width: 116rpx;
  height: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  color: #10141e;
  background: linear-gradient(135deg, #ffdd7a, #f4ae2f);
  font-size: 19rpx;
  font-weight: 850;
}

.mini-action.ghost {
  color: rgba(232, 240, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.07);
}

.archive-link {
  color: rgba(232, 240, 255, 0.82);
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.07);
}

@media (max-width: 420px) {
  .schedule-hero {
    flex-direction: column;
  }

  .hero-actions {
    flex: none;
    flex-direction: row;
  }

  .hero-btn {
    flex: 1;
  }

  .match-row {
    grid-template-columns: 78rpx minmax(0, 1fr);
  }

  .row-side {
    grid-column: 1 / -1;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .row-actions {
    flex-direction: row;
  }
}
</style>
