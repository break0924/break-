<template>
  <view class="compliance-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <section class="hero-card">
      <view class="eyebrow">Compliance</view>
      <view class="hero-title">合规声明</view>
      <view class="hero-sub">
        本页面用于说明本产品的服务边界、会员权益范围与内容使用限制。
      </view>
    </section>

    <section
      v-for="section in sections"
      :key="section.title"
      class="statement-card"
      :class="section.tone"
    >
      <view class="statement-head">
        <view class="statement-icon">{{ section.icon }}</view>
        <view>
          <view class="statement-title">{{ section.title }}</view>
          <view class="statement-sub">{{ section.sub }}</view>
        </view>
      </view>

      <view class="statement-list">
        <view
          v-for="item in section.items"
          :key="item"
          class="statement-item"
        >
          <view class="item-dot" />
          <view>{{ item }}</view>
        </view>
      </view>
    </section>
  </view>
</template>

<script setup lang="ts">
const sections = [
  {
    title: '我们提供的服务',
    sub: '围绕世界杯内容阅读、数据参考与挑战积分展示。',
    icon: '✓',
    tone: 'provide',
    items: [
      '足球赛事数据分析',
      'AI 内容阅读与信息参考',
      '挑战赛积分、称号与排行榜展示',
      '会员内容解锁服务',
    ],
  },
  {
    title: '我们不提供的服务',
    sub: '本产品不提供任何资金类、票据类、代理类或确定性结果服务。',
    icon: '!',
    tone: 'limit',
    items: [
      '不提供资金账户、充值、提现或交易撮合服务',
      '不提供票据处理、返现、返利或收益结算服务',
      '不提供代投、代下单、代理履约或推广收益分成服务',
      '不提供任何确定性结果承诺',
    ],
  },
  {
    title: '会员支付说明',
    sub: '会员费用仅对应内容阅读与会员权益。',
    icon: '¥',
    tone: 'member',
    items: [
      '会员支付仅用于购买内容阅读和会员服务权益',
      '不对应资金托管、返还、兑换或收益承诺',
      '会员有效期和权益范围以页面展示为准',
    ],
  },
  {
    title: '挑战赛说明',
    sub: '挑战赛用于提升参与感，仅展示虚拟记录。',
    icon: '#',
    tone: 'challenge',
    items: [
      '挑战赛仅展示虚拟积分、称号与排行榜',
      '不涉及现金奖励、结果结算类服务或收益兑付',
      '排名与奖励规则以活动说明页面为准',
    ],
  },
  {
    title: '风险提示',
    sub: '请理性看待所有赛前内容和模型输出。',
    icon: 'i',
    tone: 'risk',
    items: [
      '所有预测和分析内容均存在不确定性',
      '相关内容仅供足球赛事数据分析与信息参考',
      '不构成任何确定性结果承诺',
    ],
  },
];
</script>

<style scoped lang="scss">
.compliance-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 28rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(64, 134, 255, 0.28), transparent 34%),
    radial-gradient(circle at 88% 8%, rgba(255, 216, 130, 0.18), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.page-bg,
.hero-card,
.statement-card {
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
  top: 320rpx;
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

.hero-card,
.statement-card {
  overflow: hidden;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 32rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 22rpx 62rpx rgba(0, 0, 0, 0.25);
}

.hero-card {
  padding: 36rpx 32rpx;
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 12rpx;
  color: #ffffff;
  font-size: 54rpx;
  font-weight: 900;
  line-height: 1.1;
}

.hero-sub {
  margin-top: 14rpx;
  color: rgba(221, 235, 255, 0.7);
  font-size: 24rpx;
  line-height: 1.55;
}

.statement-card {
  margin-top: 24rpx;
  padding: 26rpx;
}

.statement-card.provide {
  border-color: rgba(43, 203, 136, 0.22);
}

.statement-card.limit,
.statement-card.risk {
  border-color: rgba(255, 216, 130, 0.22);
}

.statement-card.member {
  border-color: rgba(64, 134, 255, 0.24);
}

.statement-head {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
}

.statement-icon {
  display: flex;
  width: 56rpx;
  height: 56rpx;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 216, 130, 0.16);
  border-radius: 18rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffd879;
  font-size: 24rpx;
  font-weight: 900;
}

.statement-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.25;
}

.statement-sub {
  margin-top: 7rpx;
  color: rgba(221, 235, 255, 0.56);
  font-size: 21rpx;
  line-height: 1.45;
}

.statement-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  margin-top: 22rpx;
}

.statement-item {
  display: flex;
  align-items: flex-start;
  gap: 13rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(247, 251, 255, 0.84);
  font-size: 23rpx;
  line-height: 1.48;
}

.item-dot {
  width: 10rpx;
  height: 10rpx;
  flex-shrink: 0;
  margin-top: 13rpx;
  border-radius: 50%;
  background: #ffd879;
  box-shadow: 0 0 16rpx rgba(255, 216, 130, 0.42);
}

@media (min-width: 900px) {
  .compliance-page {
    padding: 34px max(34px, calc((100vw - 900px) / 2));
  }
}
</style>
