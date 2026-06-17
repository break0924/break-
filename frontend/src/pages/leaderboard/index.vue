<template>
  <view class="leaderboard-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <section class="hero-card">
      <AppImage :src="ICON_ASSETS.trophy" custom-class="hero-trophy" />
      <view class="eyebrow">Season Honor Board</view>
      <view class="hero-title">挑战赛排行榜</view>
      <view class="hero-sub">赛果更新后自动结算积分，榜单按最新积分排序</view>

      <view class="my-rank-card" :class="{ guest: !auth.isLoggedIn }">
        <template v-if="auth.isLoggedIn">
          <view class="my-rank-main">
            <view>
              <view class="my-rank-label">当前排名</view>
              <view class="my-rank-value">{{ myRankText }}</view>
            </view>
            <view class="my-points">
              <text>{{ myPoints }}</text>
              <text>分</text>
            </view>
          </view>
        <view class="my-rank-grid">
          <view class="mini-stat">
            <text>{{ beatUsers }}</text>
            <text>已超过用户</text>
          </view>
          <view class="mini-stat">
            <text>{{ gapToPrevious }}</text>
            <text>距上一名</text>
          </view>
          <view class="mini-stat wide">
            <text>{{ top10Gap }}</text>
            <text>距离 Top 10</text>
          </view>
        </view>
        </template>
        <template v-else>
          <view class="guest-title">登录后查看我的排名与积分变化</view>
          <view class="guest-sub">完成挑战任务后，赛果更新会自动进入积分榜。</view>
          <view class="guest-btn" @tap="goLogin">立即登录</view>
        </template>
      </view>
    </section>

    <section class="boost-card">
      <view class="boost-title">冲榜提示</view>
      <view class="boost-list">
        <view>再得 <text>{{ gapToPrevious }}</text> 分可超过上一名</view>
        <view>当前距离 Top 10 还差 <text>{{ top10Gap }}</text> 分</view>
        <view>今日完成 <text>{{ todayTaskCount }}</text> 项预测可继续冲分</view>
      </view>
    </section>

    <section class="rule-card">
      <view class="section-head">
        <view>
          <view class="section-title">积分规则</view>
          <view class="section-sub">完成预测后等待赛果更新，系统自动结算积分</view>
        </view>
      </view>
      <view class="rule-grid">
        <view
          v-for="rule in scoreRules"
          :key="rule.label"
          class="score-rule"
        >
          <text>{{ rule.label }}</text>
          <text>{{ rule.score }}</text>
        </view>
      </view>
    </section>

    <section class="board-card">
      <view class="section-head">
        <view>
          <view class="section-title">最新积分榜</view>
          <view class="section-sub">{{ loading ? '排行榜刷新中...' : `已刷新 ${lastRefreshedAt || '-'} · 赛果更新后自动结算积分，榜单按最新积分排序` }}</view>
        </view>
        <view class="settle-badge">积分结算</view>
      </view>

      <view v-if="loading" class="loading-card">排行榜加载中...</view>

      <view v-else-if="items.length === 0" class="empty-card">
        <view class="empty-title">排行榜即将开启</view>
        <view class="empty-sub">完成挑战任务后即可进入积分榜，赛果更新后自动结算</view>
        <view class="empty-actions">
          <view class="primary-btn" @tap="goChallenge">去参加今日挑战</view>
          <view class="secondary-btn" @tap="goChallengeRules">查看挑战规则</view>
        </view>
      </view>

      <template v-else>
        <view class="podium-list">
          <view
            v-for="(item, index) in podiumItems"
            :key="item.id"
            class="podium-item"
            :class="[`top-${index + 1}`, { mine: isMine(item) }]"
          >
            <view class="podium-rank">
              <AppImage :src="ICON_ASSETS.trophy" custom-class="podium-icon" />
              <text>#{{ index + 1 }}</text>
            </view>
            <view class="podium-user">
              <view class="user-name">{{ item.user.nickname || '世界杯用户' }}</view>
              <view class="user-title">{{ item.title || '新晋挑战者' }}</view>
            </view>
            <view class="podium-points">
              <text>{{ item.points }}</text>
              <text>分</text>
            </view>
          </view>
        </view>

        <view class="rank-list">
          <view v-if="auth.isLoggedIn && currentUserInRest" class="mine-divider">我的当前排名</view>
          <view
            v-for="(item, index) in visibleRestItems"
            :key="item.id"
            class="rank-row"
            :class="{ mine: isMine(item), compact: index < 7 }"
          >
            <view class="rank-number">#{{ item.rank || index + 4 }}</view>
            <view class="rank-user">
              <view class="user-name">{{ item.user.nickname || '世界杯用户' }}</view>
              <view class="user-title">
                {{ item.title || '新晋挑战者' }} · 已参与 {{ taskCount(item) }} 项
              </view>
            </view>
            <view class="rank-points">
              <text>{{ item.points }}</text>
              <text>分</text>
            </view>
          </view>
        </view>
      </template>
    </section>

    <LeaderboardRewardNotice :current-rank="currentUserRank" />
  </view>
</template>

<script setup lang="ts">
import { onHide, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type { LeaderboardItem } from '../../api/types';
import LeaderboardRewardNotice from '../../components/challenge/LeaderboardRewardNotice.vue';
import AppImage from '../../components/media/AppImage.vue';
import { useAuthStore } from '../../stores/auth';
import { ICON_ASSETS } from '../../utils/assets';
import { subscribeMatchMonitor } from '../../utils/match-monitor';

const items = ref<LeaderboardItem[]>([]);
const loading = ref(false);
const lastRefreshedAt = ref('');
const auth = useAuthStore();
let unsubscribeMonitor: (() => void) | null = null;

const scoreRules = [
  { label: '胜平负', score: '+3' },
  { label: '比分', score: '+10' },
  { label: '冠军', score: '+50' },
  { label: '四强每队', score: '+20' },
  { label: '金靴', score: '+30' },
];

const todayTaskCount = 4;

const currentUserItem = computed(() => {
  const userId = auth.user?.id;
  if (!userId) return null;
  return items.value.find((item) => item.user.id === userId) || null;
});
const currentUserRank = computed(() => {
  const hit = currentUserItem.value;
  if (!hit) return null;
  return hit.rank || items.value.indexOf(hit) + 1;
});
const myRankText = computed(() => (currentUserRank.value ? `#${currentUserRank.value}` : '未上榜'));
const myPoints = computed(() => currentUserItem.value?.points || 0);
const beatUsers = computed(() => {
  if (!currentUserRank.value) return 0;
  return Math.max(items.value.length - currentUserRank.value, 0);
});
const gapToPrevious = computed(() => {
  const rank = currentUserRank.value;
  if (!rank || rank <= 1) return rank === 1 ? 0 : 6;
  const previous = items.value[rank - 2];
  const mine = currentUserItem.value;
  if (!previous || !mine) return 6;
  return Math.max(previous.points - mine.points + 1, 0);
});
const top10Gap = computed(() => {
  const rank = currentUserRank.value;
  const mine = currentUserItem.value;
  if (rank && rank <= 10) return 0;
  const tenth = items.value[9];
  if (tenth && mine) return Math.max(tenth.points - mine.points + 1, 0);
  return 24;
});
const podiumItems = computed(() => items.value.slice(0, 3));
const restItems = computed(() => items.value.slice(3));
const visibleRestItems = computed(() =>
  auth.isLoggedIn ? restItems.value : restItems.value.filter((item) => item.user.id !== 'demo_user'),
);
const currentUserInRest = computed(() => restItems.value.some((item) => isMine(item)));

onShow(() => {
  auth.restore();
  loadLeaderboard();
  unsubscribeMonitor?.();
  unsubscribeMonitor = subscribeMatchMonitor((event) => {
    if (
      event.type === 'match.settlement.updated' ||
      event.type === 'match.result.corrected'
    ) {
      loadLeaderboard();
    }
  });
});

onHide(() => {
  unsubscribeMonitor?.();
  unsubscribeMonitor = null;
});

async function loadLeaderboard() {
  loading.value = true;
  try {
    items.value = await api.leaderboard();
  } catch {
    items.value = [];
  } finally {
    lastRefreshedAt.value = formatRefreshTime();
    loading.value = false;
  }
}

function isMine(item: LeaderboardItem) {
  return Boolean(auth.user?.id && item.user.id === auth.user.id);
}

function taskCount(item: LeaderboardItem) {
  return Math.max(1, Math.floor(item.points / 13));
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' });
}

function goChallenge() {
  uni.navigateTo({ url: '/pages/prediction-submit/index?mode=daily' });
}

function goChallengeRules() {
  uni.switchTab({ url: '/pages/challenge/index' });
}

function formatRefreshTime() {
  const date = new Date();
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${hour}:${minute}`;
}
</script>

<style scoped lang="scss">
.leaderboard-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 28rpx;
  background:
    radial-gradient(circle at 15% 0%, rgba(64, 134, 255, 0.3), transparent 34%),
    radial-gradient(circle at 88% 7%, rgba(255, 216, 130, 0.2), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.page-bg,
.hero-card,
.boost-card,
.rule-card,
.board-card {
  position: relative;
  z-index: 1;
}

.glow,
.motion-line {
  pointer-events: none;
  position: absolute;
}

.glow {
  border-radius: 50%;
  opacity: 0.72;
}

.glow-gold {
  top: -120rpx;
  right: -90rpx;
  width: 320rpx;
  height: 320rpx;
  background: rgba(255, 216, 130, 0.24);
}

.glow-blue {
  top: 340rpx;
  left: -120rpx;
  width: 300rpx;
  height: 300rpx;
  background: rgba(64, 134, 255, 0.22);
}

.motion-line {
  height: 3rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 216, 130, 0.5), transparent);
  transform: rotate(-15deg);
}

.line-a {
  top: 210rpx;
  right: -80rpx;
  width: 360rpx;
}

.line-b {
  top: 840rpx;
  left: -120rpx;
  width: 320rpx;
}

.hero-card,
.boost-card,
.rule-card,
.board-card {
  overflow: hidden;
  margin-top: 28rpx;
  padding: 30rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 32rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 22rpx 62rpx rgba(0, 0, 0, 0.25);
}

.hero-card {
  margin-top: 0;
}

:deep(.hero-trophy) {
  position: absolute;
  right: 24rpx;
  top: 26rpx;
  width: 150rpx;
  height: 150rpx;
  opacity: 0.2;
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 12rpx;
  color: #ffffff;
  font-size: 52rpx;
  font-weight: 900;
  line-height: 1.08;
}

.hero-sub,
.section-sub {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.66);
  font-size: 23rpx;
  line-height: 1.5;
}

.my-rank-card {
  margin-top: 24rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.3);
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.22), transparent 34%),
    linear-gradient(135deg, rgba(255, 216, 130, 0.1), rgba(64, 134, 255, 0.07));
  box-shadow: 0 16rpx 46rpx rgba(255, 216, 130, 0.08);
}

.my-rank-main {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
}

.my-rank-label {
  color: rgba(255, 242, 199, 0.68);
  font-size: 21rpx;
  font-weight: 900;
}

.my-rank-value {
  margin-top: 8rpx;
  color: #ffd879;
  font-size: 72rpx;
  font-weight: 900;
  line-height: 1;
}

.my-points {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
  color: rgba(221, 235, 255, 0.66);
  font-weight: 900;
}

.my-points text:first-child {
  color: #ffffff;
  font-size: 42rpx;
}

.my-rank-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-top: 18rpx;
}

.mini-stat.wide {
  grid-column: 1 / -1;
}

.mini-stat {
  padding: 17rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.055);
}

.mini-stat text {
  display: block;
}

.mini-stat text:first-child {
  color: #ffd879;
  font-size: 30rpx;
  font-weight: 900;
}

.mini-stat text:last-child {
  margin-top: 6rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 20rpx;
}

.guest-title {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.guest-sub {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.6);
  font-size: 22rpx;
  line-height: 1.45;
}

.guest-btn {
  display: inline-flex;
  margin-top: 18rpx;
  padding: 15rpx 22rpx;
  border-radius: 999rpx;
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 23rpx;
  font-weight: 900;
}

.boost-card {
  border-color: rgba(255, 216, 130, 0.2);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.16), transparent 34%),
    rgba(8, 16, 38, 0.76);
}

.boost-title,
.section-title {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.boost-list {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12rpx;
  margin-top: 18rpx;
}

.boost-list view {
  padding: 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.16);
  border-radius: 20rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(255, 216, 130, 0.07);
  color: rgba(255, 242, 199, 0.78);
  font-size: 22rpx;
  line-height: 1.4;
}

.boost-list text {
  color: #ffd879;
  font-size: 32rpx;
  font-weight: 900;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.rule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10rpx;
}

.score-rule {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  padding: 16rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.12);
  border-radius: 20rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.1), transparent 34%),
    rgba(255, 255, 255, 0.06);
}

.score-rule text:first-child {
  color: rgba(247, 251, 255, 0.84);
  font-size: 21rpx;
  font-weight: 850;
}

.score-rule text:last-child {
  color: #ffd879;
  font-size: 38rpx;
  font-weight: 900;
}

.settle-badge {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffd879;
  font-size: 20rpx;
  font-weight: 900;
}

.loading-card,
.empty-card {
  padding: 30rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(221, 235, 255, 0.66);
}

.empty-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.empty-sub {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.6);
  font-size: 22rpx;
  line-height: 1.45;
}

.empty-actions {
  display: flex;
  gap: 14rpx;
  margin-top: 24rpx;
}

.primary-btn,
.secondary-btn {
  display: flex;
  min-height: 76rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 23rpx;
  font-weight: 900;
}

.primary-btn {
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
}

.secondary-btn {
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 242, 199, 0.84);
}

.podium-list,
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 13rpx;
}

.podium-item,
.rank-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
}

.podium-item {
  min-height: 128rpx;
  box-sizing: border-box;
  padding: 22rpx;
  border-color: rgba(255, 216, 130, 0.18);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.15), transparent 34%),
    rgba(255, 255, 255, 0.06);
}

.top-1 {
  border-color: rgba(255, 216, 130, 0.36);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.24), transparent 34%),
    rgba(255, 216, 130, 0.1);
}

.top-2 {
  border-color: rgba(210, 220, 235, 0.34);
  background:
    radial-gradient(circle at 92% 0%, rgba(210, 220, 235, 0.22), transparent 34%),
    rgba(210, 220, 235, 0.075);
}

.top-3 {
  border-color: rgba(211, 142, 79, 0.34);
  background:
    radial-gradient(circle at 92% 0%, rgba(211, 142, 79, 0.2), transparent 34%),
    rgba(211, 142, 79, 0.075);
}

.podium-rank {
  display: flex;
  width: 112rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  color: #ffd879;
  font-size: 26rpx;
  font-weight: 900;
}

:deep(.podium-icon) {
  width: 54rpx;
  height: 54rpx;
}

.podium-user,
.rank-user {
  min-width: 0;
  flex: 1;
}

.user-name {
  overflow: hidden;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-title {
  margin-top: 7rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 21rpx;
  line-height: 1.35;
}

.podium-points,
.rank-points {
  display: flex;
  min-width: 112rpx;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  color: rgba(221, 235, 255, 0.58);
  font-size: 19rpx;
  font-weight: 800;
}

.podium-points text:first-child,
.rank-points text:first-child {
  color: #ffd879;
  font-size: 38rpx;
  font-weight: 900;
  line-height: 1;
}

.rank-list {
  margin-top: 18rpx;
}

.rank-row {
  padding: 18rpx;
}

.rank-row.mine,
.podium-item.mine {
  border-color: rgba(255, 216, 130, 0.36);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.2), transparent 34%),
    rgba(255, 216, 130, 0.08);
  box-shadow: 0 0 34rpx rgba(255, 216, 130, 0.08);
}

.mine-divider {
  margin: 18rpx 0 4rpx;
  color: #ffd879;
  font-size: 23rpx;
  font-weight: 900;
}

.rank-number {
  width: 74rpx;
  flex-shrink: 0;
  color: #ffd879;
  font-size: 24rpx;
  font-weight: 900;
}

@media (min-width: 900px) {
  .leaderboard-page {
    padding: 34px max(34px, calc((100vw - 980px) / 2));
  }

  .rule-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
