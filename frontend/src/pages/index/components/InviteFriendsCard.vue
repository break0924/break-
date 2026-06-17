<template>
  <view class="invite-card">
    <view class="invite-glow glow-a" />
    <view class="invite-glow glow-b" />
    <view class="invite-line line-a" />
    <view class="invite-line line-b" />

    <view class="invite-head">
      <view>
        <view class="kicker">Invite Boost</view>
        <view class="title">邀请好友一起看赛前情报</view>
        <view class="subtitle">分享近期赛程与AI足球分析，解锁更多会员体验</view>
      </view>
      <view class="share-mark">AI</view>
    </view>

    <view class="invite-body">
      <view class="invite-left">
        <view class="code-box">
          <text class="code-label">我的邀请码</text>
          <text class="code-value">{{ invite.code }}</text>
        </view>
        <view class="data-grid">
          <view class="invite-stat-card">
            <text class="data-value">{{ invite.invitedCount }}</text>
            <text class="data-label">已邀请人数</text>
          </view>
          <view class="invite-stat-card">
            <text class="data-value">{{ invite.paidInvitedCount }}</text>
            <text class="data-label">已邀请付费人数</text>
          </view>
        </view>
      </view>

      <view class="invite-actions">
        <button class="share-btn" open-type="share" @tap="shareInvite">立即分享</button>
        <view class="copy-btn" @tap="copyCode">复制邀请码</view>
      </view>
    </view>

    <view class="reward-list">
      <view
        v-for="item in invite.rewards"
        :key="item"
        class="reward-item"
      >
        <view class="reward-dot" />
        <text>{{ item }}</text>
      </view>
    </view>

  </view>
</template>

<script setup lang="ts">
import type { InviteMock } from '../mock';

const props = defineProps<{
  invite: InviteMock;
}>();

function copyCode() {
  uni.setClipboardData({
    data: props.invite.code,
    success: () => {
      uni.showToast({
        title: '邀请码已复制',
        icon: 'none',
      });
    },
  });
}

function shareInvite() {
  const text = `我在用AI世界杯预测官看赛前情报，邀请码：${props.invite.code}。一起看近期赛程与AI足球分析。`;
  uni.showToast({ title: '正在准备分享内容', icon: 'none' });
  uni.setClipboardData({
    data: text,
    success: () => {
      uni.showToast({ title: '分享文案已复制', icon: 'success' });
    },
    fail: () => {
      uni.showToast({ title: '请使用右上角分享', icon: 'none' });
    },
  });
}
</script>

<style scoped lang="scss">
.invite-card {
  position: relative;
  overflow: hidden;
  margin-top: 42rpx;
  padding: 30rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.24);
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 86% 0%, rgba(255, 216, 130, 0.22), transparent 30%),
    radial-gradient(circle at 0% 100%, rgba(36, 92, 255, 0.22), transparent 34%),
    linear-gradient(135deg, rgba(12, 27, 64, 0.94), rgba(7, 10, 24, 0.96) 54%, rgba(62, 11, 36, 0.9));
  color: #ffffff;
  box-shadow: 0 28rpx 72rpx rgba(0, 0, 0, 0.32), 0 0 46rpx rgba(255, 216, 130, 0.08);
}

.invite-glow,
.invite-line {
  pointer-events: none;
  position: absolute;
}

.invite-glow {
  border-radius: 50%;
  filter: blur(34rpx);
}

.glow-a {
  top: -74rpx;
  right: -42rpx;
  width: 210rpx;
  height: 210rpx;
  background: rgba(255, 216, 130, 0.28);
}

.glow-b {
  left: -84rpx;
  bottom: -82rpx;
  width: 240rpx;
  height: 240rpx;
  background: rgba(36, 92, 255, 0.24);
}

.invite-line {
  height: 3rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.52), transparent);
  transform: rotate(-18deg);
}

.line-a {
  top: 118rpx;
  right: -70rpx;
  width: 270rpx;
}

.line-b {
  right: 44rpx;
  bottom: 138rpx;
  width: 210rpx;
}

.invite-head,
.invite-body,
.reward-list,
.invite-actions {
  position: relative;
  z-index: 1;
}

.invite-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 22rpx;
}

.kicker {
  color: #ffd879;
  font-size: 21rpx;
  font-weight: 900;
}

.title {
  margin-top: 8rpx;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.28;
}

.subtitle {
  margin-top: 10rpx;
  color: rgba(221, 235, 255, 0.66);
  font-size: 23rpx;
  line-height: 1.5;
}

.share-mark {
  display: flex;
  width: 78rpx;
  height: 78rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 216, 130, 0.32);
  border-radius: 24rpx;
  background: rgba(255, 216, 130, 0.12);
  color: #ffd879;
  font-size: 26rpx;
  font-weight: 900;
  box-shadow: 0 0 28rpx rgba(255, 216, 130, 0.16);
}

.invite-body {
  display: grid;
  grid-template-columns: minmax(0, 1.08fr) minmax(226rpx, 0.92fr);
  gap: 20rpx;
  margin-top: 26rpx;
  align-items: stretch;
}

.invite-left {
  display: grid;
  gap: 14rpx;
}

.code-box,
.invite-stat-card,
.reward-item {
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.07);
}

.code-box {
  padding: 22rpx;
  border-color: rgba(255, 216, 130, 0.22);
  background: rgba(255, 216, 130, 0.08);
}

.code-label,
.code-value,
.data-value,
.data-label {
  display: block;
}

.code-label,
.data-label {
  color: rgba(214, 229, 255, 0.58);
  font-size: 20rpx;
}

.code-value {
  margin-top: 10rpx;
  color: #ffd879;
  font-size: 38rpx;
  font-weight: 900;
  letter-spacing: 0;
  text-shadow: 0 0 24rpx rgba(255, 216, 121, 0.18);
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12rpx;
}

.invite-stat-card {
  min-height: 124rpx;
  box-sizing: border-box;
  padding: 18rpx 10rpx;
  text-align: center;
}

.data-value {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
}

.data-label {
  margin-top: 8rpx;
  line-height: 1.28;
}

.reward-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 18rpx;
  opacity: 0.72;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 13rpx 16rpx;
  color: rgba(240, 247, 255, 0.72);
  font-size: 21rpx;
  font-weight: 800;
  line-height: 1.4;
}

.reward-dot {
  width: 12rpx;
  height: 12rpx;
  flex-shrink: 0;
  border-radius: 50%;
  background: #ffd879;
  box-shadow: 0 0 20rpx rgba(255, 216, 121, 0.72);
}

.invite-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14rpx;
  margin-top: 0;
}

.copy-btn,
.share-btn {
  box-sizing: border-box;
  min-height: 84rpx;
  padding: 22rpx 18rpx;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 900;
  line-height: normal;
  text-align: center;
  transition: transform 0.16s ease, opacity 0.16s ease;
}

.copy-btn:active,
.share-btn:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.copy-btn {
  border: 1rpx solid rgba(255, 216, 130, 0.32);
  background: linear-gradient(135deg, rgba(255, 216, 130, 0.12), rgba(255, 255, 255, 0.07));
  color: #fff1c2;
  font-size: 25rpx;
  box-shadow: inset 0 0 24rpx rgba(255, 216, 130, 0.05);
}

.share-btn {
  margin: 0;
  border: 0;
  background: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 30rpx;
  box-shadow: 0 18rpx 52rpx rgba(255, 216, 121, 0.36);
}

.share-btn::after {
  border: 0;
}

@media (min-width: 900px) {
  .invite-card {
    padding: 34px;
  }

  .title {
    font-size: 31px;
  }

  .subtitle {
    font-size: 18px;
  }

  .invite-body {
    gap: 18px;
  }

  .reward-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
}
</style>
