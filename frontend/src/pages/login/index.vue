<template>
  <view class="login-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <section class="login-hero">
      <view class="eyebrow">Login</view>
      <view class="hero-title">登录后开启世界杯专属内容</view>
      <view class="hero-sub">参与挑战赛、保存预测记录、同步会员权益与邀请码</view>

      <view class="hero-badge-row">
        <view class="hero-badge">挑战积分</view>
        <view class="hero-badge">会员权益</view>
        <view class="hero-badge">专属邀请码</view>
      </view>
    </section>

    <section class="benefit-card">
      <view class="section-title">登录后你可以</view>
      <view class="benefit-list">
        <view
          v-for="item in loginBenefits"
          :key="item.title"
          class="benefit-item"
        >
          <view class="benefit-icon">{{ item.icon }}</view>
          <view class="benefit-copy">
            <view class="benefit-title">{{ item.title }}</view>
            <view class="benefit-sub">{{ item.sub }}</view>
          </view>
        </view>
      </view>
    </section>

    <view class="login-hint">登录后自动保存挑战记录与会员状态</view>
    <view class="login-action" @tap="login">
      <view class="wechat-icon">微</view>
      <view>微信一键登录</view>
    </view>

    <section class="trust-card">
      <view class="trust-line"><text class="trust-icon">✓</text>仅用于身份识别和权益同步</view>
      <view class="trust-line"><text class="trust-icon">✓</text>不会公开你的个人信息</view>
    </section>
  </view>
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth';

const auth = useAuthStore();

const loginBenefits = [
  {
    icon: '🏆',
    title: '参与世界杯挑战赛',
    sub: '提交每日预测，累计积分冲榜',
  },
  {
    icon: '📌',
    title: '保存我的预测记录',
    sub: '自动同步战绩、排名与挑战数据',
  },
  {
    icon: '✨',
    title: '同步会员权益状态',
    sub: '已开通会员可直接查看完整内容',
  },
  {
    icon: '🎟',
    title: '生成专属邀请码',
    sub: '邀请好友一起参与并获得体验奖励',
  },
];

async function login() {
  try {
    await auth.loginWithWeChatProfile();
    uni.showToast({ title: '登录成功', icon: 'success' });
    setTimeout(() => uni.navigateBack(), 700);
  } catch (error) {
    uni.showToast({ title: error instanceof Error ? error.message : '登录失败', icon: 'none' });
  }
}
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 28rpx 28rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(64, 134, 255, 0.3), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(255, 216, 130, 0.2), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.page-bg,
.login-hero,
.benefit-card,
.login-action,
.trust-card {
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
  top: 360rpx;
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
  top: 820rpx;
  left: -120rpx;
  width: 320rpx;
}

.login-hero,
.benefit-card,
.trust-card {
  overflow: hidden;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 32rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 22rpx 62rpx rgba(0, 0, 0, 0.25);
}

.login-hero {
  padding: 32rpx 32rpx;
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 12rpx;
  color: #ffffff;
  font-size: 56rpx;
  font-weight: 900;
  line-height: 1.12;
}

.hero-sub {
  margin-top: 12rpx;
  color: rgba(221, 235, 255, 0.68);
  font-size: 25rpx;
  line-height: 1.5;
}

.hero-badge-row {
  display: flex;
  flex-wrap: wrap;
  gap: 9rpx;
  margin-top: 18rpx;
}

.hero-badge {
  padding: 8rpx 13rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.14);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.075);
  color: rgba(255, 242, 199, 0.82);
  font-size: 19rpx;
  font-weight: 900;
}

.benefit-card {
  margin-top: 22rpx;
  padding: 24rpx;
}

.section-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 16rpx;
}

.benefit-item {
  display: flex;
  gap: 14rpx;
  padding: 17rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.06);
}

.benefit-icon {
  display: flex;
  width: 52rpx;
  height: 52rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: rgba(255, 216, 130, 0.1);
  font-size: 27rpx;
}

.benefit-copy {
  min-width: 0;
  flex: 1;
}

.benefit-title {
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 900;
}

.benefit-sub {
  margin-top: 6rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 20rpx;
  line-height: 1.38;
}

.login-hint {
  margin-top: 22rpx;
  color: rgba(255, 242, 199, 0.76);
  font-size: 22rpx;
  font-weight: 800;
  text-align: center;
}

.login-action {
  display: flex;
  min-height: 96rpx;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  margin-top: 12rpx;
  border-radius: 999rpx;
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 30rpx;
  font-weight: 900;
  box-shadow: 0 22rpx 66rpx rgba(255, 216, 121, 0.38);
}

.wechat-icon {
  display: flex;
  width: 52rpx;
  height: 52rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #19be6b;
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 900;
}

.trust-card {
  margin-top: 18rpx;
  padding: 18rpx 22rpx;
  border-color: rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.16);
}

.trust-line {
  display: flex;
  align-items: center;
  gap: 9rpx;
  color: rgba(221, 235, 255, 0.54);
  font-size: 20rpx;
  line-height: 1.5;
}

.trust-icon {
  color: rgba(255, 216, 130, 0.72);
  font-size: 19rpx;
  font-weight: 900;
}

@media (min-width: 900px) {
  .login-page {
    padding: 46px max(34px, calc((100vw - 720px) / 2));
  }
}
</style>
