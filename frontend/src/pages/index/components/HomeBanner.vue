<template>
  <view class="home-banner">
    <view class="banner-field" />
    <view class="banner-flare flare-a" />
    <view class="banner-flare flare-b" />
    <view class="speed-line speed-a" />
    <view class="speed-line speed-b" />
    <view class="spark spark-a" />
    <view class="spark spark-b" />
    <view class="spark spark-c" />
    <view class="spark spark-d" />
    <view class="spark spark-e" />
    <view class="gold-beam" />
    <view class="banner-orbit orbit-a" />
    <view class="banner-orbit orbit-b" />
    <view class="banner-ball">
      <view class="ball-core">AI</view>
    </view>
    <view class="banner-content">
      <view class="status-badge">{{ status }}</view>
      <view class="tag-row">
        <view
          v-for="tag in tags"
          :key="tag"
          class="matchday-tag"
        >
          {{ tag }}
        </view>
      </view>
      <view class="banner-title">{{ title }}</view>
      <view class="banner-subtitle">
        <text>{{ subtitle }}</text>
      </view>
      <view class="banner-points">
        <view>
          <text class="point-value">4</text>
          <text class="point-label">场预测</text>
        </view>
        <view>
          <text class="point-value">赛前发布</text>
          <text class="point-label">临场滚动更新</text>
        </view>
        <view>
          <text class="point-value">会员</text>
          <text class="point-label">深度解锁</text>
        </view>
      </view>
      <view class="banner-actions">
        <view class="primary-action" @tap="$emit('primary')">查看今日预测</view>
        <view class="secondary-action" @tap="$emit('member')">开通会员</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  subtitle: string;
  status: string;
  tags: string[];
}>();

defineEmits<{
  primary: [];
  member: [];
}>();
</script>

<style scoped lang="scss">
.home-banner {
  position: relative;
  min-height: 718rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 216, 130, 0.32);
  border-radius: 36rpx;
  background:
    radial-gradient(circle at 70% 20%, rgba(248, 205, 91, 0.3), transparent 25%),
    radial-gradient(circle at 8% 78%, rgba(36, 92, 255, 0.22), transparent 34%),
    linear-gradient(135deg, rgba(11, 35, 89, 0.98), rgba(8, 12, 28, 0.97) 52%, rgba(76, 9, 37, 0.9));
  box-shadow: 0 36rpx 100rpx rgba(0, 0, 0, 0.42), 0 0 42rpx rgba(255, 216, 130, 0.08);
}

.home-banner::before {
  content: '';
  position: absolute;
  inset: 1rpx;
  pointer-events: none;
  border-radius: 34rpx;
  background:
    linear-gradient(100deg, rgba(45, 126, 255, 0.2), transparent 36%),
    linear-gradient(20deg, transparent 48%, rgba(212, 37, 75, 0.18));
}

.banner-field,
.banner-orbit,
.banner-ball,
.banner-flare,
.speed-line,
.gold-beam,
.spark {
  position: absolute;
  pointer-events: none;
}

.banner-field {
  right: -170rpx;
  bottom: -102rpx;
  width: 720rpx;
  height: 380rpx;
  border: 2rpx solid rgba(120, 255, 210, 0.2);
  border-radius: 50%;
  background: radial-gradient(ellipse at center, rgba(24, 156, 91, 0.2), transparent 68%);
}

.banner-flare {
  border-radius: 50%;
  filter: blur(36rpx);
}

.flare-a {
  top: 68rpx;
  right: 72rpx;
  width: 250rpx;
  height: 250rpx;
  background: rgba(246, 198, 88, 0.4);
}

.flare-b {
  left: -80rpx;
  bottom: 120rpx;
  width: 240rpx;
  height: 240rpx;
  background: rgba(64, 134, 255, 0.26);
}

.speed-line {
  height: 3rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  transform: rotate(-18deg);
}

.speed-a {
  top: 226rpx;
  right: -52rpx;
  width: 380rpx;
}

.speed-b {
  right: 20rpx;
  bottom: 248rpx;
  width: 320rpx;
}

.gold-beam {
  position: absolute;
  left: -130rpx;
  bottom: 186rpx;
  width: 620rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: linear-gradient(90deg, transparent, rgba(255, 216, 121, 0.75), transparent);
  transform: rotate(-10deg);
  box-shadow: 0 0 24rpx rgba(255, 216, 121, 0.45);
}

.spark {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #ffd879;
  box-shadow: 0 0 20rpx rgba(255, 216, 121, 0.9);
}

.spark-a {
  top: 78rpx;
  left: 54rpx;
}

.spark-b {
  top: 176rpx;
  left: 390rpx;
}

.spark-c {
  right: 190rpx;
  bottom: 92rpx;
}

.spark-d {
  top: 310rpx;
  left: 132rpx;
  width: 6rpx;
  height: 6rpx;
}

.spark-e {
  right: 88rpx;
  bottom: 248rpx;
  width: 10rpx;
  height: 10rpx;
}

.banner-orbit {
  width: 420rpx;
  height: 420rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 50%;
}

.orbit-a {
  top: -160rpx;
  right: -120rpx;
}

.orbit-b {
  right: 42rpx;
  bottom: 96rpx;
  width: 210rpx;
  height: 210rpx;
}

.banner-ball {
  right: 76rpx;
  top: 156rpx;
  display: flex;
  width: 154rpx;
  height: 154rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.22);
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 28%, #ffffff, #b9d7ff 44%, #2457d5 45%, #0c1432 78%);
  box-shadow: 0 0 70rpx rgba(64, 134, 255, 0.45);
}

.ball-core {
  display: flex;
  width: 76rpx;
  height: 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: rgba(5, 12, 30, 0.72);
  color: #ffd879;
  font-size: 28rpx;
  font-weight: 900;
}

.banner-content {
  position: relative;
  z-index: 1;
  padding: 40rpx 38rpx;
}

.status-badge {
  display: inline-flex;
  padding: 13rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.32);
  border-radius: 999rpx;
  background: linear-gradient(135deg, rgba(255, 216, 130, 0.2), rgba(255, 255, 255, 0.06));
  color: #ffe3a5;
  font-size: 21rpx;
  font-weight: 800;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 18rpx;
}

.matchday-tag {
  padding: 14rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.16);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(232, 240, 255, 0.86);
  font-size: 22rpx;
  font-weight: 800;
}

.banner-title {
  width: 670rpx;
  max-width: 82%;
  margin-top: 30rpx;
  font-size: 92rpx;
  font-weight: 900;
  line-height: 1.02;
  text-shadow: 0 0 42rpx rgba(255, 216, 121, 0.16);
}

.banner-subtitle {
  display: inline-flex;
  margin-top: 18rpx;
  padding: 14rpx 20rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.24);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffe0a0;
  font-size: 32rpx;
  font-weight: 800;
}

.banner-points {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  width: 100%;
  max-width: 710rpx;
  margin-top: 32rpx;
}

.banner-points > view {
  padding: 18rpx 12rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.07);
}

.point-value,
.point-label {
  display: block;
  text-align: center;
}

.point-value {
  font-size: 34rpx;
  font-weight: 900;
}

.point-label {
  margin-top: 7rpx;
  color: rgba(212, 226, 250, 0.62);
  font-size: 20rpx;
}

.banner-actions {
  display: flex;
  max-width: 710rpx;
  gap: 18rpx;
  margin-top: 34rpx;
}

.primary-action,
.secondary-action {
  position: relative;
  z-index: 2;
  flex: 1;
  padding: 27rpx 22rpx;
  border-radius: 24rpx;
  text-align: center;
  font-size: 33rpx;
  font-weight: 900;
  transition: transform 0.16s ease, opacity 0.16s ease, box-shadow 0.16s ease;
}

.primary-action:active,
.secondary-action:active {
  transform: scale(0.97);
  opacity: 0.9;
}

.primary-action {
  background: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  box-shadow: 0 24rpx 76rpx rgba(246, 198, 88, 0.56);
}

.secondary-action {
  border: 1rpx solid rgba(255, 216, 130, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: rgba(247, 251, 255, 0.82);
  font-size: 29rpx;
}

@media (min-width: 900px) {
  .home-banner {
    min-height: 642px;
  }

  .banner-content {
    padding: 44px 54px;
  }

  .banner-title {
    width: 880px;
    font-size: 86px;
  }

  .banner-subtitle {
    font-size: 28px;
  }
}
</style>
