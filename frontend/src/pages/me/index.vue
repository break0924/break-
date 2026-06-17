<template>
  <view class="me-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <section class="profile-hero" :class="{ 'is-login': auth.isLoggedIn }">
      <view class="profile-top">
        <view class="avatar-wrap">
          <AppImage
            v-if="auth.user?.avatarUrl"
            :src="auth.user.avatarUrl"
            custom-class="avatar-image"
          />
          <view v-else class="avatar-placeholder">{{ avatarInitial }}</view>
        </view>
        <view class="profile-copy">
          <view class="profile-name">{{ displayName }}</view>
          <view class="profile-status">{{ statusText }}</view>
          <view class="identity-row">
            <text class="identity-tag" :class="{ member: isMember }">{{ identityText }}</text>
            <text class="identity-note">World Cup Intelligence</text>
          </view>
        </view>
      </view>

      <view class="growth-tip">{{ growthTip }}</view>

      <view class="hero-stats">
        <view class="hero-stat points-badge">
          <text class="stat-value">{{ myPoints }}</text>
          <text class="stat-label">当前积分</text>
        </view>
        <view class="hero-stat title-badge">
          <text class="stat-value title-value">{{ myTitle }}</text>
          <text class="stat-label">当前称号</text>
        </view>
      </view>

      <view class="hero-actions">
        <view
          v-if="!auth.isLoggedIn"
          class="primary-btn"
          @tap="go('/pages/login/index')"
        >
          <text class="wechat-mark">微</text>
          <text>微信一键登录</text>
        </view>
        <view
          v-else-if="!isMember"
          class="primary-btn"
          @tap="go('/pages/membership/index')"
        >
          开通会员
        </view>
        <view
          v-else
          class="primary-btn"
          @tap="go('/pages/today/index')"
        >
          查看今日完整分析
        </view>
        <view
          v-if="auth.isLoggedIn"
          class="ghost-btn"
          @tap="logout"
        >
          退出登录
        </view>
      </view>
    </section>

    <section class="section-card challenge-card">
      <view class="section-head">
        <view>
          <view class="section-title">我的挑战</view>
          <view class="section-sub">{{ auth.isLoggedIn ? '积分、排名和预测记录会持续同步' : '登录后查看我的挑战记录' }}</view>
        </view>
        <view class="section-action" @tap="go('/pages/challenge/index')">去挑战</view>
      </view>

      <view class="challenge-grid">
        <view
          v-for="item in challengeStats"
          :key="item.label"
          class="data-card"
        >
          <text class="data-value">{{ item.value }}</text>
          <text class="data-label">{{ item.label }}</text>
        </view>
      </view>

      <view class="record-entry" @tap="go('/pages/archive/index')">
        <view>
          <view class="entry-title">我的预测记录</view>
          <view class="entry-sub">查看已提交内容与积分结算进度</view>
        </view>
        <view class="record-action">
          <text>查看</text>
          <text class="entry-arrow">›</text>
        </view>
      </view>
    </section>

    <section class="section-card member-card">
      <view class="member-head">
        <view>
          <view class="section-title">会员中心</view>
          <view class="section-sub">{{ membershipText }}</view>
        </view>
        <view class="member-badge" :class="{ active: isMember }">{{ isMember ? '高级会员' : '待开通' }}</view>
      </view>

      <view class="benefit-grid">
        <view
          v-for="benefit in memberBenefits"
          :key="benefit"
          class="benefit-item"
        >
          {{ benefit }}
        </view>
      </view>

      <view class="member-cta" @tap="go('/pages/membership/index')">
        {{ isMember ? '查看会员权益' : '开通会员' }}
      </view>
    </section>

    <section class="section-card invite-card">
      <view class="section-head">
        <view>
          <view class="section-title">邀请好友</view>
          <view class="section-sub">分享赛前情报入口，邀请好友一起参与挑战</view>
        </view>
      </view>

      <view class="invite-body">
        <view class="invite-code-box">
          <view class="invite-label">我的邀请码</view>
          <view class="invite-code-row">
            <view class="invite-code">{{ inviteStatus?.inviteCode || fallbackInvite.inviteCode }}</view>
          </view>
          <view class="invite-hint">复制后发给好友，注册后自动计入邀请数据</view>
        </view>
        <view class="invite-stats">
          <view class="invite-stat">
            <text class="invite-num">{{ inviteStatus?.invitedCount ?? fallbackInvite.invitedCount }}</text>
            <text class="invite-text">已邀请人数</text>
          </view>
          <view class="invite-stat">
            <text class="invite-num">{{ inviteStatus?.invitedPaidCount ?? fallbackInvite.invitedPaidCount }}</text>
            <text class="invite-text">已邀请付费人数</text>
          </view>
        </view>
      </view>

      <view class="invite-actions">
        <view class="copy-btn" @tap="copyInviteCode">
          <text class="copy-icon">⧉</text>
          <text>复制邀请码</text>
        </view>
        <button class="share-btn" open-type="share" @tap="shareInvite">立即分享</button>
      </view>
    </section>

    <section class="section-card more-card">
      <view class="section-title">更多入口</view>
      <view class="more-list">
        <view
          v-for="item in moreEntries"
          :key="item.title"
          class="more-item"
          @tap="handleMore(item)"
        >
          <view>
            <view class="more-title">{{ item.title }}</view>
            <view class="more-sub">{{ item.sub }}</view>
          </view>
          <view class="entry-arrow">›</view>
        </view>
      </view>
    </section>
  </view>
</template>

<script setup lang="ts">
import { onShareAppMessage, onShow } from '@dcloudio/uni-app';
import { computed, ref } from 'vue';
import { api } from '../../api';
import type {
  ChallengeHome,
  InviteStatus,
  MembershipStatus,
  MyChallengeScore,
} from '../../api/types';
import AppImage from '../../components/media/AppImage.vue';
import { useAuthStore } from '../../stores/auth';
import { consumeMembershipActivationTip } from '../../utils/membershipTips';

const auth = useAuthStore();
const challengeHome = ref<ChallengeHome | null>(null);
const challengeScore = ref<MyChallengeScore | null>(null);
const membership = ref<MembershipStatus | null>(null);
const inviteStatus = ref<InviteStatus | null>(null);

const fallbackInvite: InviteStatus = {
  inviteCode: 'WC2026-AI88',
  inviterId: null,
  invitedCount: 8,
  invitedPaidCount: 2,
};

const memberBenefits = [
  '解锁今日全部场次',
  '查看完整推荐理由',
  '查看历史命中率详情',
  '解锁高级榜单与荣誉排名',
];

const moreEntries = [
  {
    title: '挑战赛排行榜',
    sub: '查看积分排名和奖励说明',
    url: '/pages/leaderboard/index',
  },
  {
    title: '合规声明',
    sub: '服务边界与风险提示',
    url: '/pages/compliance/index',
  },
  {
    title: '用户协议',
    sub: '账号使用与内容服务规则',
    url: '/pages/agreement/index',
  },
  {
    title: '隐私政策',
    sub: '个人信息使用与保护说明',
    url: '/pages/privacy/index',
  },
];

const displayName = computed(() => auth.user?.nickname || '未登录');
const avatarInitial = computed(() => (displayName.value === '未登录' ? 'AI' : displayName.value.slice(0, 1)));
const isMember = computed(() => Boolean(membership.value?.isMember || auth.isMember));
const identityText = computed(() => (isMember.value ? '高级会员' : '免费用户'));
const statusText = computed(() =>
  auth.isLoggedIn
    ? '挑战记录已同步，继续追踪赛前情报'
    : '登录后保存挑战记录并解锁完整内容',
);
const myPoints = computed(() =>
  auth.isLoggedIn
    ? challengeScore.value?.score.points ?? challengeHome.value?.myScore?.points ?? 0
    : '登录后查看',
);
const myRank = computed(() =>
  auth.isLoggedIn
    ? challengeScore.value?.score.rank ?? challengeHome.value?.myScore?.rank ?? '--'
    : '--',
);
const myTitle = computed(() =>
  auth.isLoggedIn
    ? challengeScore.value?.score.title || challengeHome.value?.myScore?.title || '新晋挑战者'
    : '登录后查看',
);
const nextTitleGap = computed(() => {
  if (!auth.isLoggedIn) return 100;
  return Math.max(0, 100 - Number(myPoints.value || 0));
});
const growthTip = computed(() => {
  if (!auth.isLoggedIn) {
    return '登录后保存我的挑战战绩，再完成 1 项任务可继续累计积分';
  }
  if (myRank.value !== '--') {
    return `距离下一称号还差 ${nextTitleGap.value} 分，继续参与挑战，冲击排行榜前 10`;
  }
  return `当前距离下一称号还差 ${nextTitleGap.value} 分`;
});
const membershipText = computed(() => {
  if (isMember.value) {
    return membership.value?.membershipExpireAt
      ? `会员有效期至 ${membership.value.membershipExpireAt}`
      : '世界杯通行证已生效，可查看完整内容与挑战高级权益';
  }
  return '解锁当天全部比赛预测、完整推荐理由与高级榜单';
});

const challengeStats = computed(() => [
  { label: '当前积分', value: myPoints.value },
  { label: '当前排名', value: myRank.value === '--' ? '--' : `#${myRank.value}` },
  { label: '已参与任务', value: auth.isLoggedIn ? '3' : '--' },
  { label: '当前称号', value: myTitle.value },
]);

onShow(load);

onShareAppMessage(() => {
  const code = inviteStatus.value?.inviteCode || fallbackInvite.inviteCode;
  return {
    title: `AI世界杯预测官：一起看赛前情报，邀请码 ${code}`,
    path: `/pages/index/index?inviteCode=${code}`,
  };
});

async function load() {
  auth.restore();
  consumeMembershipActivationTip('me');
  await Promise.all([
    loadChallenge(),
    loadMembership(),
    loadInvite(),
  ]);
}

async function loadChallenge() {
  try {
    challengeHome.value = await api.challengeHome();
    if (auth.isLoggedIn && challengeHome.value?.season?.id) {
      challengeScore.value = await api.myChallengeScore(challengeHome.value.season.id);
    }
  } catch {
    challengeHome.value = null;
    challengeScore.value = null;
  }
}

async function loadMembership() {
  try {
    membership.value = await api.membershipStatus();
  } catch {
    membership.value = null;
  }
}

async function loadInvite() {
  try {
    inviteStatus.value = await api.inviteStatus();
  } catch {
    inviteStatus.value = fallbackInvite;
  }
}

const tabBarPages = new Set([
  '/pages/index/index',
  '/pages/today/index',
  '/pages/challenge/index',
  '/pages/me/index',
]);

function go(url: string) {
  const cleanUrl = url.split('?')[0];
  const method = tabBarPages.has(cleanUrl) ? uni.switchTab : uni.navigateTo;
  method({
    url,
    fail: () => {
      uni.showToast({ title: '页面打开失败，请稍后重试', icon: 'none' });
    },
  });
}

function handleMore(item: { title: string; url?: string; type?: string }) {
  if (item.url) {
    go(item.url);
    return;
  }
  uni.showToast({ title: `${item.title}整理中`, icon: 'none' });
}

function copyInviteCode() {
  const code = inviteStatus.value?.inviteCode || fallbackInvite.inviteCode;
  uni.setClipboardData({
    data: code,
    success: () => uni.showToast({ title: '邀请码已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '复制失败，请稍后重试', icon: 'none' }),
  });
}

function shareInvite() {
  const code = inviteStatus.value?.inviteCode || fallbackInvite.inviteCode;
  const text = `我在用AI世界杯预测官看赛前情报，邀请码：${code}。一起参与挑战赛，查看每日足球分析。`;
  uni.showToast({ title: '正在准备分享内容', icon: 'none' });
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '分享文案已复制', icon: 'success' }),
    fail: () => uni.showToast({ title: '请使用右上角分享', icon: 'none' }),
  });
}

function logout() {
  auth.logout();
  challengeScore.value = null;
  uni.showToast({ title: '已退出', icon: 'success' });
}
</script>

<style scoped lang="scss">
.me-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 28rpx;
  background:
    radial-gradient(circle at 14% 0%, rgba(64, 134, 255, 0.28), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(255, 216, 130, 0.18), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.page-bg,
.profile-hero,
.section-card {
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
  top: 300rpx;
  left: -110rpx;
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
  top: 190rpx;
  right: -70rpx;
  width: 340rpx;
}

.line-b {
  top: 760rpx;
  left: -120rpx;
  width: 320rpx;
}

.profile-hero,
.section-card {
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 30rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 20rpx 58rpx rgba(0, 0, 0, 0.24);
}

.profile-hero {
  overflow: hidden;
  padding: 34rpx;
  border-color: rgba(255, 216, 130, 0.2);
  background:
    radial-gradient(circle at 18% 12%, rgba(64, 134, 255, 0.16), transparent 34%),
    radial-gradient(circle at 94% 0%, rgba(255, 216, 130, 0.14), transparent 36%),
    rgba(8, 16, 38, 0.78);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 22rpx;
}

.avatar-wrap {
  display: flex;
  width: 148rpx;
  height: 148rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2rpx solid rgba(255, 216, 130, 0.28);
  border-radius: 40rpx;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 216, 130, 0.28), transparent 42%),
    linear-gradient(135deg, rgba(36, 85, 180, 0.9), rgba(10, 17, 42, 0.95));
  box-shadow: 0 18rpx 50rpx rgba(0, 0, 0, 0.28), 0 0 36rpx rgba(255, 216, 130, 0.1);
}

:deep(.avatar-image) {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  color: #ffd879;
  font-size: 44rpx;
  font-weight: 900;
}

.profile-copy {
  min-width: 0;
  flex: 1;
}

.profile-name {
  color: #ffffff;
  font-size: 42rpx;
  font-weight: 900;
  line-height: 1.18;
}

.profile-status {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.62);
  font-size: 23rpx;
  line-height: 1.42;
}

.identity-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10rpx;
  margin-top: 14rpx;
}

.identity-tag,
.identity-note,
.member-badge {
  border-radius: 999rpx;
  font-weight: 900;
}

.identity-tag {
  padding: 8rpx 14rpx;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(221, 235, 255, 0.78);
  font-size: 20rpx;
}

.identity-tag.member {
  background: rgba(255, 216, 130, 0.13);
  color: #ffd879;
}

.identity-note {
  padding: 8rpx 14rpx;
  background: rgba(64, 134, 255, 0.12);
  color: rgba(194, 218, 255, 0.84);
  font-size: 19rpx;
}

.growth-tip {
  margin-top: 24rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.16);
  border-radius: 18rpx;
  background:
    linear-gradient(90deg, rgba(255, 216, 130, 0.11), rgba(64, 134, 255, 0.08));
  color: rgba(255, 242, 199, 0.88);
  font-size: 22rpx;
  font-weight: 800;
  line-height: 1.4;
}

.hero-stats,
.challenge-grid,
.benefit-grid,
.invite-stats {
  display: grid;
  gap: 14rpx;
}

.hero-stats {
  grid-template-columns: 1fr 1fr;
  margin-top: 28rpx;
}

.hero-stat,
.data-card,
.benefit-item,
.invite-stat {
  border: 1rpx solid rgba(255, 255, 255, 0.09);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.06);
}

.hero-stat {
  padding: 22rpx 18rpx;
  border-color: rgba(255, 216, 130, 0.16);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.14), transparent 36%),
    rgba(255, 255, 255, 0.065);
}

.profile-hero:not(.is-login) .hero-stat {
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.045);
}

.points-badge {
  box-shadow: inset 0 0 0 1rpx rgba(255, 216, 130, 0.04);
}

.title-badge {
  background:
    radial-gradient(circle at 92% 0%, rgba(64, 134, 255, 0.16), transparent 36%),
    rgba(255, 255, 255, 0.065);
}

.stat-value,
.stat-label,
.data-value,
.data-label,
.invite-num,
.invite-text {
  display: block;
}

.stat-value {
  color: #ffd879;
  font-size: 36rpx;
  font-weight: 900;
  line-height: 1.1;
}

.profile-hero:not(.is-login) .stat-value {
  color: rgba(221, 235, 255, 0.62);
  font-size: 29rpx;
}

.title-value {
  color: #ffffff;
  font-size: 31rpx;
}

.stat-label {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 20rpx;
}

.hero-actions,
.invite-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 28rpx;
}

.primary-btn,
.ghost-btn,
.member-cta,
.copy-btn,
.share-btn,
.section-action {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-weight: 900;
}

.primary-btn,
.member-cta,
.share-btn {
  min-height: 88rpx;
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 26rpx;
  box-shadow: 0 18rpx 54rpx rgba(255, 216, 121, 0.26);
}

.primary-btn {
  flex: 1.28;
  gap: 14rpx;
  letter-spacing: 0;
  min-height: 94rpx;
  font-size: 28rpx;
  box-shadow: 0 22rpx 64rpx rgba(255, 216, 121, 0.34);
}

.wechat-mark {
  display: flex;
  width: 50rpx;
  height: 50rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #19be6b;
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 900;
}

.ghost-btn,
.copy-btn {
  flex: 0.8;
  min-height: 82rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.22);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 242, 199, 0.9);
  font-size: 24rpx;
}

.section-card {
  margin-top: 28rpx;
  padding: 28rpx;
}

.section-head,
.member-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 20rpx;
}

.section-title {
  color: #ffffff;
  font-size: 33rpx;
  font-weight: 900;
  line-height: 1.2;
}

.section-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 22rpx;
  line-height: 1.45;
}

.section-action {
  flex-shrink: 0;
  padding: 13rpx 20rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffd879;
  font-size: 21rpx;
}

.challenge-grid {
  grid-template-columns: 1fr 1fr;
}

.data-card {
  padding: 20rpx;
}

.data-value {
  overflow: hidden;
  color: #ffffff;
  font-size: 31rpx;
  font-weight: 900;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-label {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 20rpx;
}

.record-entry,
.more-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.05);
}

.record-entry {
  margin-top: 18rpx;
  padding: 24rpx;
  border-color: rgba(255, 216, 130, 0.28);
  background:
    radial-gradient(circle at 96% 0%, rgba(255, 216, 130, 0.2), transparent 32%),
    linear-gradient(135deg, rgba(255, 216, 130, 0.1), rgba(64, 134, 255, 0.07));
  box-shadow: 0 14rpx 42rpx rgba(0, 0, 0, 0.16);
}

.entry-title,
.more-title {
  color: #ffffff;
  font-size: 26rpx;
  font-weight: 900;
}

.entry-sub,
.more-sub {
  margin-top: 6rpx;
  color: rgba(221, 235, 255, 0.54);
  font-size: 21rpx;
  line-height: 1.4;
}

.entry-arrow {
  color: #ffd879;
  font-size: 38rpx;
  font-weight: 900;
}

.record-action {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4rpx;
  padding: 13rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.12);
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.record-action .entry-arrow {
  font-size: 28rpx;
  line-height: 1;
}

.member-card {
  border-color: rgba(255, 216, 130, 0.2);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.14), transparent 34%),
    rgba(8, 16, 38, 0.76);
}

.member-badge {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(221, 235, 255, 0.72);
  font-size: 20rpx;
}

.member-badge.active {
  background: rgba(255, 216, 130, 0.13);
  color: #ffd879;
}

.benefit-grid {
  grid-template-columns: 1fr 1fr;
}

.benefit-item {
  padding: 18rpx;
  border-color: rgba(255, 216, 130, 0.12);
  background:
    linear-gradient(135deg, rgba(255, 216, 130, 0.075), rgba(64, 134, 255, 0.06));
  color: rgba(247, 251, 255, 0.88);
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.38;
}

.member-cta {
  margin-top: 20rpx;
}

.invite-card {
  background:
    radial-gradient(circle at 88% 0%, rgba(87, 143, 255, 0.18), transparent 32%),
    rgba(8, 16, 38, 0.76);
}

.invite-body {
  display: grid;
  grid-template-columns: 1.12fr 1fr;
  gap: 16rpx;
}

.invite-code-box {
  display: flex;
  min-height: 150rpx;
  flex-direction: column;
  justify-content: center;
  padding: 22rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.16);
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 94% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(255, 216, 130, 0.08);
}

.invite-label {
  color: rgba(255, 242, 199, 0.64);
  font-size: 20rpx;
  font-weight: 800;
}

.invite-code {
  color: #ffd879;
  font-size: 33rpx;
  font-weight: 900;
  line-height: 1.1;
}

.invite-code-row {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
}

.invite-hint {
  margin-top: 12rpx;
  color: rgba(221, 235, 255, 0.5);
  font-size: 19rpx;
  line-height: 1.4;
}

.invite-stats {
  grid-template-columns: 1fr;
}

.invite-stat {
  min-height: 108rpx;
  box-sizing: border-box;
  padding: 17rpx 14rpx;
  border-color: rgba(255, 216, 130, 0.12);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.1), transparent 34%),
    rgba(255, 255, 255, 0.055);
  text-align: center;
}

.invite-num {
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 900;
}

.invite-text {
  margin-top: 6rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 19rpx;
}

.copy-btn,
.share-btn {
  flex: 1;
  box-sizing: border-box;
}

.copy-btn {
  gap: 8rpx;
  flex: 0.88;
  border-color: rgba(255, 216, 130, 0.28);
  background: rgba(255, 216, 130, 0.09);
  color: #fff1c2;
}

.share-btn {
  flex: 1.12;
}

.copy-icon {
  color: #ffd879;
  font-size: 25rpx;
  font-weight: 900;
}

.share-btn {
  margin: 0;
  border: 0;
}

.share-btn::after {
  border: 0;
}

.more-list {
  display: flex;
  flex-direction: column;
  gap: 13rpx;
  margin-top: 20rpx;
}

.more-item {
  padding: 22rpx 20rpx;
  border-color: rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.055), rgba(64, 134, 255, 0.035));
}

.more-item .entry-arrow {
  display: flex;
  width: 44rpx;
  height: 44rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.14);
  background: rgba(255, 216, 130, 0.1);
  font-size: 32rpx;
}

@media (min-width: 900px) {
  .me-page {
    padding: 34px max(34px, calc((100vw - 980px) / 2));
  }

  .profile-hero {
    padding: 36px;
  }

  .challenge-grid,
  .benefit-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
