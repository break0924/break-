<template>
  <view class="challenge-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <view class="hero-card">
      <AppImage :src="IMAGE_ASSETS.sharePosterBg" custom-class="hero-bg" mode="aspectFill" />
      <view class="hero-shade" />
      <view class="hero-content">
        <view class="eyebrow">World Cup Challenge</view>
        <view class="hero-title">世界杯挑战赛</view>
        <view class="hero-sub">预测冠军、四强、金靴和每日赛果，冲击排行榜前十</view>

        <view class="hero-stats">
          <view class="hero-stat primary points-stat">
            <text class="stat-value">{{ myPoints }}</text>
            <text class="stat-label">当前积分</text>
          </view>
          <view class="hero-stat title-stat">
            <text class="stat-value">{{ myTitle }}</text>
            <text class="stat-label">当前称号</text>
          </view>
          <view class="hero-stat rank-stat">
            <text class="stat-value">#{{ myRank }}</text>
            <text class="stat-label">当前排名</text>
          </view>
        </view>

        <view class="hero-actions">
          <view class="primary-btn" @tap="goMatchPick">立即参与今日挑战</view>
          <view class="ghost-btn" @tap="goLeaderboard">查看排行榜</view>
        </view>
      </view>
    </view>

    <section class="section-block">
      <view class="section-head">
        <view>
          <view class="section-title">今日挑战任务</view>
          <view class="section-sub">完成预测即可累计积分，结果揭晓后自动结算</view>
        </view>
      </view>
      <view class="task-grid">
        <view
          v-for="task in challengeTasks"
          :key="task.title"
          class="task-card"
          :class="{ featured: task.featured }"
        >
          <view class="task-top">
            <view class="task-icon">{{ task.icon }}</view>
            <view class="task-status" :class="task.statusClass">{{ task.status }}</view>
          </view>
          <view class="task-title">{{ task.title }}</view>
          <view class="task-desc">{{ task.desc }}</view>
          <view class="task-reward">{{ task.reward }}</view>
          <view class="task-btn" @tap="task.action">{{ task.button }}</view>
        </view>
      </view>
    </section>

    <section class="section-block">
      <view class="section-title">我的挑战进度</view>
      <view class="growth-panel">
        <view class="growth-title">成长提示</view>
        <view class="growth-copy">距离下一称号还差 {{ nextTitleGap }} 分，再完成 1 项任务可继续累计积分</view>
      </view>
      <view class="progress-grid">
        <view
          v-for="item in progressItems"
          :key="item.label"
          class="progress-card"
          :class="{ highlight: item.highlight }"
        >
          <text class="progress-value">{{ item.value }}</text>
          <text class="progress-label">{{ item.label }}</text>
        </view>
      </view>
    </section>

    <section class="section-block">
      <view class="section-title">积分规则</view>
      <view class="rule-grid">
        <view
          v-for="rule in rules"
          :key="rule.label"
          class="rule-card"
        >
          <text class="rule-label">{{ rule.label }}</text>
          <text class="rule-score">{{ rule.score }}</text>
        </view>
      </view>
      <view class="safe-note">挑战仅展示虚拟积分和称号，不设置现金奖励。</view>
    </section>

    <section class="section-block ranking-card">
      <view class="ranking-copy">
        <view class="section-title">我的排名</view>
        <view class="ranking-line">#{{ myRank }}</view>
        <view class="ranking-metrics">
          <view class="ranking-chip">已超过 <text>{{ rankingInfo.beatUsers }}</text> 位用户</view>
          <view class="ranking-chip">距离上一名 <text>{{ rankingInfo.gapToPrevious }}</text> 分</view>
        </view>
        <view class="ranking-muted">继续完成挑战任务，冲击 Top 10 荣誉奖励席位</view>
      </view>
      <view class="rank-medal">
        <AppImage :src="ICON_ASSETS.trophy" custom-class="rank-icon" mode="aspectFit" />
      </view>
    </section>

    <ChallengeRewardCards
      class="reward-module"
      :current-rank="myRank"
      @rules="showRewardRules"
    />

    <section class="section-block poster-section">
      <view class="section-head">
        <view>
          <view class="section-title">我的世界杯挑战卡</view>
          <view class="section-sub">生成专属挑战海报，分享你的积分、称号和参与进度</view>
        </view>
      </view>
      <view class="poster-card">
        <AppImage :src="IMAGE_ASSETS.sharePosterBg" mode="aspectFill" custom-class="poster-image" />
        <view class="poster-shade" />
        <view class="poster-content">
          <view class="poster-title">世界杯挑战卡</view>
          <view class="poster-score">{{ myPoints }} 分</view>
          <view class="poster-sub">{{ myTitle }} · 当前排名 #{{ myRank }} · 已完成 {{ progressMock.settledTasks }} 项</view>
        </view>
      </view>
      <view class="poster-actions">
        <view class="ghost-btn poster-btn" @tap="generatePoster">生成我的挑战海报</view>
        <button class="primary-btn poster-btn share-btn" open-type="share" @tap="shareChallenge">立即分享战绩</button>
      </view>
    </section>

    <view v-if="posterVisible" class="poster-modal">
      <view class="poster-mask" @tap="closePoster" />
      <view class="poster-sheet">
        <view class="poster-sheet-head">
          <view>
            <view class="poster-sheet-title">海报已生成</view>
            <view class="poster-sheet-sub">当前为可截图保存的挑战卡预览</view>
          </view>
          <view class="poster-close" @tap="closePoster">×</view>
        </view>

        <view class="poster-preview">
          <view class="poster-preview-kicker">World Cup Challenge</view>
          <view class="poster-preview-title">世界杯挑战赛</view>
          <view class="poster-preview-score">{{ myPoints }} 分</view>
          <view class="poster-preview-grid">
            <view>
              <text>{{ myTitle }}</text>
              <text>当前称号</text>
            </view>
            <view>
              <text>#{{ myRank }}</text>
              <text>当前排名</text>
            </view>
            <view>
              <text>{{ progressMock.settledTasks }} 项</text>
              <text>已完成任务</text>
            </view>
          </view>
          <view class="poster-preview-note">AI分析仅供足球数据参考，挑战赛仅计算虚拟积分与称号。</view>
        </view>

        <view class="poster-modal-actions">
          <view class="ghost-btn poster-btn" @tap="savePosterFallback">保存预览</view>
          <button class="primary-btn poster-btn share-btn" open-type="share" @tap="shareChallenge">立即分享战绩</button>
        </view>
      </view>
    </view>

    <view v-if="rewardRulesVisible" class="rules-modal">
      <view class="rules-mask" @tap="closeRewardRules" />
      <view class="rules-sheet">
        <view class="rules-sheet-head">
          <view class="rules-head-copy">
            <view class="rules-title">Top 10 荣誉奖励规则</view>
            <view class="rules-sub">奖励以世界杯挑战赛最终积分榜为准，活动结束后统一确认</view>
          </view>
          <view class="rules-close" @tap="closeRewardRules">×</view>
        </view>

        <scroll-view scroll-y class="rules-scroll">
          <view class="rules-group">
            <view class="rules-group-title">前10名奖励内容</view>
            <view
              v-for="tier in rewardConfig"
              :key="tier.rankLabel"
              class="rules-tier"
            >
              <view class="rules-tier-head">
                <text class="rules-rank" :style="{ color: tier.highlightColor }">{{ tier.rankLabel }}</text>
                <text class="rules-tier-title">{{ tier.title }}</text>
              </view>
              <view class="rules-reward-list">
                <text
                  v-for="reward in tier.rewards"
                  :key="reward"
                  class="rules-reward-item"
                >
                  {{ reward }}
                </text>
              </view>
            </view>
          </view>

          <view class="rules-group">
            <view class="rules-group-title">同分排序规则</view>
            <view class="rules-line">比分命中次数更多者优先</view>
            <view class="rules-line">胜平负命中次数更多者优先</view>
            <view class="rules-line">提交时间更早者优先</view>
          </view>

          <view class="rules-group">
            <view class="rules-group-title">奖励发放说明</view>
            <view class="rules-line">奖励结果将在世界杯结束后公示</view>
            <view class="rules-line">虚拟奖励在结果确认后自动到账</view>
            <view class="rules-line">实物奖励在收集收件信息后统一发放</view>
          </view>

          <view class="rules-group last">
            <view class="rules-group-title">作弊与异常账号处理说明</view>
            <view class="rules-line">如发现异常账号、刷号、作弊或违规行为，将取消活动资格</view>
            <view class="rules-line">本活动仅展示虚拟积分、荣誉称号与礼物奖励，不设现金奖励</view>
          </view>
        </scroll-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type { ChallengeHome, Match } from '../../api/types';
import ChallengeRewardCards from '../../components/challenge/ChallengeRewardCards.vue';
import AppImage from '../../components/media/AppImage.vue';
import { useAuthStore } from '../../stores/auth';
import { ICON_ASSETS, IMAGE_ASSETS } from '../../utils/assets';
import { rewardConfig } from '../../config/challengeRewards';
import { normalizeMatchStatus } from '../../utils/format';

const home = ref<ChallengeHome | null>(null);
const auth = useAuthStore();
const rewardRulesVisible = ref(false);
const posterVisible = ref(false);
const posterGenerating = ref(false);

const todayOpenMatches = ref<Match[]>([]);

const progressMock = {
  joinedTasks: 3,
  settledTasks: 1,
  streakDays: 2,
};

const rankingInfo = {
  beatUsers: 128,
  gapToPrevious: 6,
};

const myPoints = computed(() => home.value?.myScore?.points || 0);
const myTitle = computed(() => home.value?.myScore?.title || '新晋挑战者');
const myRank = computed(() => home.value?.myScore?.rank || 36);
const nextTitleGap = computed(() => Math.max(0, 100 - myPoints.value));

const challengeTasks = computed(() => [
  {
    icon: '⚽',
    title: '今日比赛预测',
    desc: `今日共 ${todayOpenMatches.value.length} 场可参与`,
    status: todayOpenMatches.value.length ? '未参与' : '已锁定',
    statusClass: todayOpenMatches.value.length ? 'pending' : 'settled',
    reward: todayOpenMatches.value.length
      ? `最高可得 ${todayOpenMatches.value.length * 13} 分`
      : '今日暂无可提交场次',
    button: '去预测',
    action: goMatchPick,
    featured: true,
  },
  {
    icon: '🏆',
    title: '冠军预测',
    desc: '提交你的最终冠军判断',
    status: '未参与',
    statusClass: 'pending',
    reward: '命中 +50 分',
    button: '提交预测',
    action: goTournamentPick,
    featured: false,
  },
  {
    icon: '🥇',
    title: '四强预测',
    desc: '选择你看好的四强球队',
    status: '已提交',
    statusClass: 'done',
    reward: '每队命中 +20 分',
    button: '查看预测',
    action: goTournamentPick,
    featured: false,
  },
  {
    icon: '👟',
    title: '金靴预测',
    desc: '预测本届射手王归属',
    status: '未参与',
    statusClass: 'pending',
    reward: '命中 +30 分',
    button: '提交预测',
    action: goTournamentPick,
    featured: false,
  },
]);

const progressItems = computed(() => [
  { label: '已参与任务', value: `${progressMock.joinedTasks}` },
  { label: '已结算任务', value: `${progressMock.settledTasks}` },
  { label: '连续参与天数', value: `${progressMock.streakDays}天` },
  { label: '距离下一称号', value: `${nextTitleGap.value}分`, highlight: true },
]);

const rules = [
  { label: '猜中胜平负', score: '+3' },
  { label: '猜中比分', score: '+10' },
  { label: '猜中冠军', score: '+50' },
  { label: '猜中四强', score: '每队 +20' },
  { label: '猜中金靴', score: '+30' },
];

onShow(async () => {
  try {
    auth.restore();
    const [challenge, matches] = await Promise.all([
      api.challengeHome(),
      api.matches({ date: todayKey() }).catch(() => []),
    ]);
    home.value = challenge;
    todayOpenMatches.value = matches.filter(isChallengeOpen);
    if (auth.isLoggedIn && home.value?.season) {
      const myScore = await api.myChallengeScore(home.value.season.id);
      home.value.myScore = myScore.score;
    }
  } catch {
    home.value = null;
  }
});

onShareAppMessage(() => ({
  title: shareText.value,
  path: '/pages/challenge/index',
}));

function goLeaderboard() {
  uni.navigateTo({ url: '/pages/leaderboard/index' });
}

function goTournamentPick() {
  if (!home.value?.season) {
    uni.showToast({ title: '暂无赛季', icon: 'none' });
    return;
  }
  uni.navigateTo({
    url: `/pages/prediction-submit/index?mode=tournament&seasonId=${home.value.season.id}`,
  });
}

function goMatchPick() {
  if (!todayOpenMatches.value.length) {
    uni.showToast({ title: '今日暂无可提交场次', icon: 'none' });
    return;
  }
  uni.navigateTo({ url: '/pages/prediction-submit/index?mode=daily' });
}

function todayKey() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((item) => item.type === 'year')?.value || '2026';
  const month = parts.find((item) => item.type === 'month')?.value || '01';
  const day = parts.find((item) => item.type === 'day')?.value || '01';
  return `${year}-${month}-${day}`;
}

function isChallengeOpen(match: Match) {
  return normalizeMatchStatus(match.status) === 'SCHEDULED' &&
    new Date(match.kickoffAt).getTime() > Date.now();
}

const shareText = computed(() =>
  `我在世界杯挑战赛已拿到 ${myPoints.value} 分，当前排名 #${myRank.value}，来一起冲榜`,
);

async function generatePoster() {
  if (posterGenerating.value) return;
  posterGenerating.value = true;
  uni.showLoading({ title: '生成海报中' });
  await wait(450);
  uni.hideLoading();
  posterGenerating.value = false;
  posterVisible.value = true;
  uni.showToast({ title: '海报已生成', icon: 'success' });
}

function closePoster() {
  posterVisible.value = false;
}

function savePosterFallback() {
  uni.showToast({ title: '当前为预览海报，可截图保存', icon: 'none' });
}

function shareChallenge() {
  uni.showToast({ title: '正在准备分享内容', icon: 'none' });
  uni.setClipboardData({
    data: `${shareText.value}。参加世界杯挑战赛，看看你能冲到第几名。`,
    success: () => uni.showToast({ title: '分享文案已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '请使用右上角分享', icon: 'none' }),
  });
}

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function showRewardRules() {
  rewardRulesVisible.value = true;
}

function closeRewardRules() {
  rewardRulesVisible.value = false;
}
</script>

<style scoped lang="scss">
.challenge-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 28rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(64, 134, 255, 0.3), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(255, 216, 130, 0.2), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.page-bg,
.hero-card,
.section-block {
  position: relative;
  z-index: 1;
}

.reward-module {
  position: relative;
  z-index: 1;
  margin-top: 34rpx;
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
  right: -80rpx;
  width: 320rpx;
  height: 320rpx;
  background: rgba(255, 216, 130, 0.26);
}

.glow-blue {
  left: -100rpx;
  top: 260rpx;
  width: 300rpx;
  height: 300rpx;
  background: rgba(64, 134, 255, 0.24);
}

.motion-line {
  height: 3rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 216, 130, 0.5), transparent);
  transform: rotate(-16deg);
}

.line-a {
  top: 220rpx;
  right: -80rpx;
  width: 360rpx;
}

.line-b {
  top: 820rpx;
  left: -120rpx;
  width: 320rpx;
}

.hero-card {
  overflow: hidden;
  min-height: 676rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.28);
  border-radius: 34rpx;
  background: #101f46;
  box-shadow: 0 30rpx 86rpx rgba(0, 0, 0, 0.34), 0 0 42rpx rgba(255, 216, 130, 0.08);
}

:deep(.hero-bg),
.hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-shade {
  z-index: 1;
  background:
    radial-gradient(circle at 80% 0%, rgba(255, 216, 130, 0.24), transparent 32%),
    linear-gradient(120deg, rgba(5, 10, 26, 0.96), rgba(8, 20, 58, 0.9) 58%, rgba(80, 12, 42, 0.72));
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 40rpx 34rpx;
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
  letter-spacing: 0;
}

.hero-title {
  margin-top: 14rpx;
  color: #ffffff;
  font-size: 64rpx;
  font-weight: 900;
  line-height: 1.06;
  text-shadow: 0 12rpx 38rpx rgba(0, 0, 0, 0.32);
}

.hero-sub {
  margin-top: 16rpx;
  color: rgba(255, 242, 199, 0.9);
  font-size: 29rpx;
  font-weight: 850;
  line-height: 1.5;
}

.hero-stats {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 13rpx;
  margin-top: 30rpx;
}

.hero-stat {
  min-height: 128rpx;
  box-sizing: border-box;
  padding: 20rpx 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 22rpx;
  background:
    radial-gradient(circle at 88% 0%, rgba(255, 255, 255, 0.08), transparent 34%),
    rgba(255, 255, 255, 0.08);
  text-align: center;
}

.hero-stat.primary {
  border-color: rgba(255, 216, 130, 0.28);
  background:
    radial-gradient(circle at 88% 0%, rgba(255, 216, 130, 0.2), transparent 38%),
    rgba(255, 216, 130, 0.12);
  box-shadow: 0 0 36rpx rgba(255, 216, 130, 0.08);
}

.rank-stat {
  border-color: rgba(255, 216, 130, 0.34);
  background:
    radial-gradient(circle at 88% 0%, rgba(255, 216, 130, 0.24), transparent 38%),
    linear-gradient(145deg, rgba(255, 216, 130, 0.13), rgba(64, 134, 255, 0.09));
  box-shadow: 0 0 40rpx rgba(255, 216, 130, 0.1);
}

.stat-value,
.stat-label {
  display: block;
}

.stat-value {
  color: #ffffff;
  font-size: 33rpx;
  font-weight: 900;
}

.points-stat .stat-value,
.rank-stat .stat-value {
  color: #ffd879;
  font-size: 42rpx;
}

.title-stat .stat-value {
  font-size: 29rpx;
}

.stat-label {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 20rpx;
}

.hero-actions,
.poster-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 30rpx;
}

.primary-btn,
.ghost-btn,
.task-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-weight: 900;
}

.primary-btn {
  flex: 1.28;
  min-height: 94rpx;
  background: #ffd36f;
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 30rpx;
  box-shadow: 0 22rpx 66rpx rgba(255, 216, 121, 0.4);
}

.ghost-btn {
  flex: 0.72;
  min-height: 86rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.24);
  background: rgba(255, 255, 255, 0.065);
  color: rgba(255, 242, 199, 0.82);
  font-size: 23rpx;
}

.section-block {
  margin-top: 30rpx;
  padding: 26rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 30rpx;
  background: rgba(8, 16, 38, 0.74);
  box-shadow: 0 20rpx 58rpx rgba(0, 0, 0, 0.22);
}

.section-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.section-title {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.2;
}

.section-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 22rpx;
  line-height: 1.45;
}

.task-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.task-card {
  padding: 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 90% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(255, 255, 255, 0.06);
}

.task-card.featured {
  grid-column: 1 / -1;
  padding: 28rpx;
  border-color: rgba(255, 216, 130, 0.42);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.2), transparent 34%),
    linear-gradient(135deg, rgba(255, 216, 130, 0.16), rgba(64, 134, 255, 0.1));
  box-shadow: 0 22rpx 58rpx rgba(0, 0, 0, 0.26), 0 0 34rpx rgba(255, 216, 130, 0.08);
}

.task-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.task-icon {
  font-size: 34rpx;
}

.task-status {
  min-width: 92rpx;
  padding: 9rpx 13rpx;
  border-radius: 999rpx;
  font-size: 19rpx;
  font-weight: 900;
  text-align: center;
}

.task-status.pending {
  background: rgba(255, 216, 130, 0.12);
  color: #ffe0a0;
}

.task-status.done {
  background: rgba(43, 203, 136, 0.12);
  color: #99f6c8;
}

.task-status.settled {
  background: rgba(64, 134, 255, 0.13);
  color: #bcd4ff;
}

.task-title {
  margin-top: 18rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
}

.task-card.featured .task-title {
  font-size: 35rpx;
}

.task-desc {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 21rpx;
  line-height: 1.4;
}

.task-reward {
  display: inline-flex;
  margin-top: 16rpx;
  padding: 9rpx 14rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffd879;
  font-size: 24rpx;
  font-weight: 900;
}

.task-card.featured .task-reward {
  padding: 12rpx 18rpx;
  background: rgba(255, 216, 130, 0.16);
  font-size: 34rpx;
  box-shadow: 0 0 24rpx rgba(255, 216, 130, 0.08);
}

.task-btn {
  margin-top: 15rpx;
  min-height: 70rpx;
  background: rgba(255, 216, 130, 0.13);
  color: #fff1c2;
  font-size: 24rpx;
}

.task-card.featured .task-btn {
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
}

.progress-grid,
.rule-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14rpx;
  margin-top: 18rpx;
}

.growth-panel {
  margin-top: 16rpx;
  padding: 18rpx 20rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 22rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.13), transparent 34%),
    rgba(255, 216, 130, 0.07);
}

.growth-title {
  color: #ffd879;
  font-size: 24rpx;
  font-weight: 900;
}

.growth-copy {
  margin-top: 8rpx;
  color: rgba(255, 242, 199, 0.78);
  font-size: 22rpx;
  line-height: 1.45;
}

.progress-card,
.rule-card {
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.06);
}

.rule-card {
  border-color: rgba(255, 216, 130, 0.13);
  background:
    radial-gradient(circle at 95% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(255, 255, 255, 0.06);
}

.progress-value,
.progress-label,
.rule-label,
.rule-score {
  display: block;
}

.progress-value {
  color: #ffd879;
  font-size: 35rpx;
  font-weight: 900;
}

.progress-label {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
}

.progress-card {
  min-height: 118rpx;
  box-sizing: border-box;
}

.progress-card.highlight {
  border-color: rgba(255, 216, 130, 0.24);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.14), transparent 36%),
    rgba(255, 216, 130, 0.08);
}

.progress-card.highlight .progress-value {
  font-size: 38rpx;
}

.rule-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
}

.rule-label {
  color: rgba(247, 251, 255, 0.86);
  font-size: 22rpx;
  font-weight: 800;
}

.rule-score {
  color: #ffd879;
  font-size: 39rpx;
  font-weight: 900;
}

.safe-note {
  margin-top: 14rpx;
  padding: 13rpx 16rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 18rpx;
  background: rgba(0, 0, 0, 0.14);
  color: rgba(221, 235, 255, 0.42);
  font-size: 19rpx;
  line-height: 1.45;
}

.ranking-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22rpx;
  border-color: rgba(255, 216, 130, 0.18);
  background:
    radial-gradient(circle at 94% 0%, rgba(255, 216, 130, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(8, 16, 38, 0.78), rgba(10, 24, 62, 0.72));
}

.ranking-copy {
  min-width: 0;
  flex: 1;
}

.ranking-line {
  margin-top: 10rpx;
  color: #ffd879;
  font-size: 76rpx;
  font-weight: 900;
  line-height: 1;
}

.ranking-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.ranking-chip {
  padding: 11rpx 15rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.14);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.08);
  color: rgba(221, 235, 255, 0.68);
  font-size: 21rpx;
  font-weight: 800;
}

.ranking-chip text {
  color: #ffd879;
  font-size: 28rpx;
  font-weight: 900;
}

.ranking-muted {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.54);
  font-size: 22rpx;
  line-height: 1.45;
}

.rank-medal {
  display: flex;
  width: 128rpx;
  height: 128rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 216, 130, 0.22);
  border-radius: 34rpx;
  background: rgba(255, 216, 130, 0.1);
}

:deep(.rank-icon) {
  width: 76rpx;
  height: 76rpx;
}

.poster-card {
  position: relative;
  overflow: hidden;
  height: 430rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.075);
}

:deep(.poster-image) {
  width: 100%;
  height: 100%;
}

.poster-shade {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 78% 0%, rgba(255, 216, 130, 0.22), transparent 34%),
    linear-gradient(180deg, rgba(5, 10, 24, 0.18), rgba(5, 10, 24, 0.9));
}

.poster-content {
  position: absolute;
  left: 28rpx;
  right: 28rpx;
  bottom: 28rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.2);
  border-radius: 26rpx;
  background: rgba(5, 10, 24, 0.76);
}

.poster-title {
  color: #ffffff;
  font-size: 29rpx;
  font-weight: 900;
}

.poster-score {
  margin-top: 8rpx;
  color: #ffd879;
  font-size: 74rpx;
  font-weight: 900;
  line-height: 1;
}

.poster-sub {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.68);
  font-size: 24rpx;
  font-weight: 700;
  line-height: 1.42;
}

.poster-actions {
  margin-top: 20rpx;
}

.poster-btn {
  box-sizing: border-box;
}

.share-btn {
  margin: 0;
  border: 0;
}

.share-btn::after {
  border: 0;
}

.poster-modal {
  position: fixed;
  inset: 0;
  z-index: 30;
}

.poster-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.64);
}

.poster-sheet {
  position: absolute;
  right: 28rpx;
  bottom: 28rpx;
  left: 28rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 216, 130, 0.24);
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 88% 0%, rgba(255, 216, 130, 0.16), transparent 34%),
    #081026;
  box-shadow: 0 -20rpx 70rpx rgba(0, 0, 0, 0.4);
}

.poster-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 26rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
}

.poster-sheet-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.poster-sheet-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
}

.poster-close {
  display: flex;
  width: 58rpx;
  height: 58rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #ffd879;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1;
}

.poster-preview {
  margin: 26rpx;
  padding: 34rpx 28rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.28);
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 90% 0%, rgba(255, 216, 130, 0.22), transparent 34%),
    radial-gradient(circle at 0% 100%, rgba(64, 134, 255, 0.18), transparent 34%),
    linear-gradient(145deg, rgba(14, 31, 74, 0.96), rgba(5, 10, 24, 0.98));
}

.poster-preview-kicker {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.poster-preview-title {
  margin-top: 12rpx;
  color: #ffffff;
  font-size: 44rpx;
  font-weight: 900;
}

.poster-preview-score {
  margin-top: 18rpx;
  color: #ffd879;
  font-size: 92rpx;
  font-weight: 900;
  line-height: 1;
}

.poster-preview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 24rpx;
}

.poster-preview-grid > view {
  padding: 16rpx 10rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.07);
  text-align: center;
}

.poster-preview-grid text {
  display: block;
}

.poster-preview-grid text:first-child {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
}

.poster-preview-grid text:last-child {
  margin-top: 6rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 18rpx;
  font-weight: 800;
}

.poster-preview-note {
  margin-top: 22rpx;
  color: rgba(221, 235, 255, 0.46);
  font-size: 19rpx;
  line-height: 1.45;
}

.poster-modal-actions {
  display: flex;
  gap: 16rpx;
  padding: 0 26rpx 26rpx;
}

.rules-modal {
  position: fixed;
  inset: 0;
  z-index: 20;
}

.rules-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.62);
}

.rules-sheet {
  position: absolute;
  right: 28rpx;
  bottom: 28rpx;
  left: 28rpx;
  overflow: hidden;
  max-height: 82vh;
  border: 1rpx solid rgba(255, 216, 130, 0.22);
  border-radius: 30rpx;
  background: #081026;
  box-shadow: 0 -20rpx 70rpx rgba(0, 0, 0, 0.38);
}

.rules-sheet-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  padding: 28rpx;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.08);
  background:
    radial-gradient(circle at 90% 0%, rgba(255, 216, 130, 0.16), transparent 34%),
    rgba(255, 255, 255, 0.045);
}

.rules-head-copy {
  min-width: 0;
  flex: 1;
}

.rules-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.25;
}

.rules-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
  line-height: 1.42;
}

.rules-close {
  display: flex;
  width: 58rpx;
  height: 58rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #ffd879;
  font-size: 40rpx;
  font-weight: 900;
  line-height: 1;
}

.rules-scroll {
  box-sizing: border-box;
  max-height: calc(82vh - 142rpx);
  padding: 24rpx 26rpx 30rpx;
}

.rules-group {
  margin-bottom: 28rpx;
}

.rules-group.last {
  margin-bottom: 4rpx;
}

.rules-group-title {
  margin-bottom: 14rpx;
  color: #ffd879;
  font-size: 25rpx;
  font-weight: 900;
}

.rules-tier {
  margin-bottom: 12rpx;
  padding: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  background:
    radial-gradient(circle at 96% 0%, rgba(255, 216, 130, 0.08), transparent 32%),
    rgba(255, 255, 255, 0.05);
}

.rules-tier-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}

.rules-rank {
  flex-shrink: 0;
  font-size: 22rpx;
  font-weight: 900;
}

.rules-tier-title {
  min-width: 0;
  color: #ffffff;
  font-size: 23rpx;
  font-weight: 900;
  text-align: right;
}

.rules-reward-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 12rpx;
}

.rules-reward-item {
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.09);
  color: rgba(255, 242, 199, 0.9);
  font-size: 19rpx;
  font-weight: 800;
}

.rules-line {
  margin-bottom: 10rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(221, 235, 255, 0.74);
  font-size: 22rpx;
  line-height: 1.45;
}

@media (min-width: 900px) {
  .challenge-page {
    padding: 34px max(34px, calc((100vw - 980px) / 2));
  }

  .task-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .rules-sheet {
    right: calc((100vw - 720px) / 2);
    left: calc((100vw - 720px) / 2);
  }
}
</style>
