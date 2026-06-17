<template>
  <view class="page overview-page">
    <view class="hero overview-hero">
      <view class="hero-field">
        <view class="field-line" />
        <view class="center-circle" />
      </view>
      <view class="eyebrow">Tournament Roadmap</view>
      <view class="h1">2026世界杯赛程总览</view>
      <view class="sub">从开幕战到决赛，一页掌握阶段安排</view>
      <view class="hero-actions">
        <view class="btn secondary" @tap="goSchedule">查看比赛列表</view>
        <button class="share-button" open-type="share">分享总览</button>
      </view>
    </view>

    <view class="timeline">
      <view
        v-for="(item, index) in phases"
        :key="item.title"
        class="timeline-item"
        :class="{ rest: item.type === 'rest', final: item.type === 'final' }"
      >
        <view class="connector" />
        <view class="marker">
          <view class="icon" :class="item.icon" />
        </view>
        <view class="phase-card">
          <view class="phase-top">
            <view>
              <view class="phase-date">{{ item.date }}</view>
              <view class="phase-title">{{ item.title }}</view>
            </view>
            <view class="phase-index">{{ String(index + 1).padStart(2, '0') }}</view>
          </view>
          <view class="phase-desc">{{ item.desc }}</view>
        </view>
      </view>
    </view>

    <view class="safe-note">
      本页为赛程信息总览，仅用于足球数据分析、赛前情报和挑战赛积分参考；不使用官方 Logo、官方吉祥物或官方奖杯图片。
    </view>
  </view>
</template>

<script setup lang="ts">
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app';

type PhaseType = 'match' | 'rest' | 'final';

type Phase = {
  date: string;
  title: string;
  desc: string;
  icon: 'ball' | 'field' | 'bracket' | 'medal' | 'cup' | 'rest';
  type: PhaseType;
};

const phases: Phase[] = [
  {
    date: '6月11日',
    title: '开幕战',
    desc: '赛事正式开启，进入世界杯节奏。',
    icon: 'ball',
    type: 'match',
  },
  {
    date: '6月11日-6月26日',
    title: '小组赛',
    desc: '48支球队分为12个小组，争夺晋级席位。',
    icon: 'field',
    type: 'match',
  },
  {
    date: '6月27日-7月3日',
    title: '32强赛',
    desc: '淘汰赛开启，单场结果决定晋级走向。',
    icon: 'bracket',
    type: 'match',
  },
  {
    date: '7月4日-7月7日',
    title: '16强赛',
    desc: '强强对话增多，战术细节和临场调整更关键。',
    icon: 'bracket',
    type: 'match',
  },
  {
    date: '7月8日',
    title: '休赛日',
    desc: '球队恢复和备战窗口，适合复盘阶段表现。',
    icon: 'rest',
    type: 'rest',
  },
  {
    date: '7月9日-7月11日',
    title: '1/4决赛',
    desc: '八强争夺半决赛席位，比赛强度继续提升。',
    icon: 'field',
    type: 'match',
  },
  {
    date: '7月12日-7月13日',
    title: '休赛日',
    desc: '半决赛前调整期，阵容健康与体能管理值得关注。',
    icon: 'rest',
    type: 'rest',
  },
  {
    date: '7月14日-7月15日',
    title: '半决赛',
    desc: '通向决赛的关键阶段，攻防取舍更具决定性。',
    icon: 'medal',
    type: 'match',
  },
  {
    date: '7月16日-7月17日',
    title: '休赛日',
    desc: '最后阶段准备期，关注阵容状态和战术变化。',
    icon: 'rest',
    type: 'rest',
  },
  {
    date: '7月18日',
    title: '季军赛',
    desc: '争夺第三名，常见开放节奏与轮换调整。',
    icon: 'medal',
    type: 'match',
  },
  {
    date: '7月19日',
    title: '决赛',
    desc: '最终对决，世界杯冠军归属在此产生。',
    icon: 'cup',
    type: 'final',
  },
];

onShareAppMessage(() => ({
  title: '2026世界杯赛程总览',
  path: '/pages/schedule/overview',
}));

onShareTimeline(() => ({
  title: '2026世界杯赛程总览',
  query: '',
}));

function goSchedule() {
  uni.navigateTo({ url: '/pages/schedule/index' });
}
</script>

<style scoped>
.overview-page {
  padding-bottom: 46rpx;
}

.overview-hero {
  position: relative;
  overflow: hidden;
  min-height: 330rpx;
}

.hero-field {
  position: absolute;
  inset: 0;
  opacity: 0.36;
}

.field-line {
  position: absolute;
  left: 42rpx;
  right: 42rpx;
  top: 52rpx;
  bottom: 52rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.35);
  border-radius: 10rpx;
}

.center-circle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 150rpx;
  height: 150rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.35);
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.overview-hero .eyebrow,
.overview-hero .h1,
.overview-hero .sub,
.hero-actions {
  position: relative;
  z-index: 1;
}

.hero-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-top: 28rpx;
}

.share-button {
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 12rpx;
  color: #031711;
  background: #b8f6d8;
  font-size: 28rpx;
  font-weight: 760;
  line-height: 76rpx;
}

.share-button::after {
  border: 0;
}

.timeline {
  position: relative;
  margin-top: 34rpx;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 78rpx 1fr;
  gap: 18rpx;
  min-height: 168rpx;
}

.connector {
  position: absolute;
  left: 38rpx;
  top: 76rpx;
  bottom: -8rpx;
  width: 4rpx;
  background: linear-gradient(180deg, rgba(25, 182, 127, 0.85), rgba(184, 246, 216, 0.08));
}

.timeline-item:last-child .connector {
  display: none;
}

.marker {
  position: relative;
  z-index: 1;
  width: 76rpx;
  height: 76rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(184, 246, 216, 0.38);
  border-radius: 50%;
  background: #102b24;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.2);
}

.phase-card {
  min-width: 0;
  padding: 24rpx;
  margin-bottom: 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 14rpx;
  background: rgba(255, 255, 255, 0.075);
}

.timeline-item.rest .phase-card {
  background: rgba(255, 255, 255, 0.048);
}

.timeline-item.final .phase-card {
  border-color: rgba(245, 214, 107, 0.42);
  background: linear-gradient(135deg, rgba(245, 214, 107, 0.18), rgba(255, 255, 255, 0.07));
}

.phase-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.phase-date {
  color: #b8f6d8;
  font-size: 24rpx;
  font-weight: 760;
}

.phase-title {
  margin-top: 8rpx;
  color: #f4fbf8;
  font-size: 32rpx;
  font-weight: 900;
}

.phase-index {
  flex: 0 0 auto;
  color: rgba(244, 251, 248, 0.18);
  font-size: 42rpx;
  font-weight: 950;
}

.phase-desc {
  margin-top: 16rpx;
  color: #cfe5dd;
  font-size: 25rpx;
  line-height: 1.6;
}

.icon {
  position: relative;
  width: 36rpx;
  height: 36rpx;
}

.icon.ball {
  border: 5rpx solid #f4fbf8;
  border-radius: 50%;
  background:
    radial-gradient(circle at 50% 50%, #071814 0 18%, transparent 19%),
    linear-gradient(45deg, transparent 42%, #071814 43% 57%, transparent 58%),
    #f4fbf8;
}

.icon.field {
  border: 4rpx solid #b8f6d8;
  border-radius: 6rpx;
}

.icon.field::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 3rpx;
  background: #b8f6d8;
}

.icon.bracket::before,
.icon.bracket::after {
  content: '';
  position: absolute;
  width: 26rpx;
  height: 14rpx;
  border: 4rpx solid #b8f6d8;
  border-left: 0;
}

.icon.bracket::before {
  left: 4rpx;
  top: 4rpx;
}

.icon.bracket::after {
  left: 4rpx;
  bottom: 4rpx;
}

.icon.medal {
  border-radius: 50%;
  background: #f5d66b;
}

.icon.medal::before {
  content: '';
  position: absolute;
  left: 8rpx;
  top: -12rpx;
  width: 20rpx;
  height: 18rpx;
  border-left: 6rpx solid #b8f6d8;
  border-right: 6rpx solid #b8f6d8;
  transform: skewX(-14deg);
}

.icon.cup::before {
  content: '';
  position: absolute;
  left: 7rpx;
  top: 2rpx;
  width: 22rpx;
  height: 24rpx;
  border-radius: 4rpx 4rpx 12rpx 12rpx;
  background: #f5d66b;
}

.icon.cup::after {
  content: '';
  position: absolute;
  left: 11rpx;
  bottom: 0;
  width: 14rpx;
  height: 12rpx;
  border-bottom: 6rpx solid #f5d66b;
  border-left: 5rpx solid transparent;
  border-right: 5rpx solid transparent;
}

.icon.rest {
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
}

.icon.rest::before {
  content: '';
  position: absolute;
  left: 10rpx;
  top: 8rpx;
  width: 16rpx;
  height: 22rpx;
  border-radius: 999rpx;
  background: #cfe5dd;
  transform: rotate(24deg);
}
</style>
