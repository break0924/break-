<template>
  <view class="membership-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <section class="pass-hero">
      <AppImage :src="IMAGE_ASSETS.memberCard" mode="aspectFill" custom-class="hero-image" />
      <view class="hero-shade" />
      <view class="hero-content">
        <view class="eyebrow">World Cup Pass</view>
        <view class="hero-tags">
          <text>世界杯专享</text>
          <text>整届可用</text>
          <text>每日持续更新</text>
        </view>
        <view class="hero-title">世界杯通行证</view>
        <view class="hero-sub">完整 AI 报告 · 每日推荐 · 高级榜单</view>
        <view class="hero-note">选择适合你的开通方式，解锁世界杯期间核心内容</view>
      </view>
    </section>

    <section v-if="status?.isMember" class="section-card active-card">
      <view class="section-title compact">会员已生效</view>
      <view class="section-sub">到期时间：{{ status.membershipExpireAt || '长期有效' }}</view>
    </section>

    <section class="section-card pricing-section">
      <view class="section-title">选择开通方式</view>
      <view class="section-sub">想先试试可选周卡，想持续追完整届世界杯，更推荐通行证。</view>

      <view class="pricing-grid">
        <view
          v-for="(card, index) in pricingCards"
          :key="card.title"
          class="pricing-card"
          :class="{ recommended: card.recommended }"
        >
          <view class="pricing-head">
            <view>
              <view class="pricing-title">{{ card.title }}</view>
              <view class="pricing-duration">{{ card.duration }}</view>
            </view>
            <view class="pricing-tags">
              <text
                v-for="tag in card.tags"
                :key="tag"
                class="pricing-tag"
              >
                {{ tag }}
              </text>
            </view>
          </view>

          <view class="pricing-main">
            <text class="currency">¥</text>
            <text class="pricing-price">{{ card.price }}</text>
            <text class="price-unit">/ {{ card.duration.replace('有效', '') }}</text>
          </view>

          <view class="pricing-benefits">
            <view
              v-for="benefit in card.benefits"
              :key="benefit"
              class="pricing-benefit"
            >
              {{ benefit }}
            </view>
          </view>

          <view v-if="card.anchor" class="pricing-anchor">{{ card.anchor }}</view>

          <view
            class="pricing-btn"
            :class="{ primary: card.recommended }"
            @tap="buyPricingCard(card, index)"
          >
            {{ paying ? '处理中...' : card.button }}
          </view>
        </view>
      </view>
    </section>

    <section class="section-card">
      <view class="section-head">
        <view>
          <view class="section-title">开通后可解锁</view>
          <view class="section-sub">覆盖赛前情报、完整理由、历史追踪和挑战荣誉</view>
        </view>
      </view>

      <view class="benefit-grid">
        <view
          v-for="(benefit, index) in benefits"
          :key="benefit.title"
          class="benefit-card"
        >
          <view class="benefit-icon-wrap">
            <AppImage :src="benefitIcon(index)" custom-class="benefit-icon" />
          </view>
          <view class="benefit-title">{{ benefit.title }}</view>
          <view class="benefit-sub">{{ benefit.sub }}</view>
        </view>
      </view>
    </section>

    <section class="section-card compare-card">
      <view class="section-title">免费用户 vs 会员用户</view>
      <view class="section-sub">看看开通后，你会多获得哪些内容</view>

      <view class="compare-grid">
        <view class="compare-column free-column">
          <view class="compare-title">免费用户</view>
          <view
            v-for="item in freeItems"
            :key="item"
            class="compare-item"
          >
            {{ item }}
          </view>
        </view>
        <view class="compare-column member-column">
          <view class="compare-title-row">
            <view class="compare-title">会员用户</view>
            <view class="compare-badge">推荐 · 已解锁全部内容</view>
          </view>
          <view
            v-for="item in memberItems"
            :key="item"
            class="compare-item strong"
          >
            {{ item }}
          </view>
        </view>
      </view>
    </section>

    <section class="section-card reason-card">
      <view class="section-title">为什么值得开通</view>
      <view class="reason-list">
        <view
          v-for="reason in reasons"
          :key="reason"
          class="reason-item"
        >
          <view class="reason-dot" />
          <view>{{ reason }}</view>
        </view>
      </view>
    </section>

    <section class="bottom-note">
      <view class="bottom-title">购买说明</view>
      <view>支付仅用于购买会员内容服务</view>
      <view>开通后可查看完整 AI 报告和每日推荐理由</view>
      <view>不涉及赛事交易、结果兑现或现金类奖励</view>
      <view>会员权益将在对应有效期内生效</view>
    </section>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { api } from '../../api';
import type { MembershipPlan, MembershipStatus } from '../../api/types';
import AppImage from '../../components/media/AppImage.vue';
import { ICON_ASSETS, IMAGE_ASSETS } from '../../utils/assets';
import { requireLogin } from '../../utils/auth';
import { setMembershipActivationTip } from '../../utils/membershipTips';

const plans = ref<MembershipPlan[]>([]);
const status = ref<MembershipStatus | null>(null);
const paying = ref(false);

type PricingCard = {
  title: string;
  price: string;
  duration: string;
  tags: string[];
  benefits: string[];
  button: string;
  recommended: boolean;
  planHint: 'week' | 'pass';
  anchor?: string;
};

const pricingCards: PricingCard[] = [
  {
    title: '体验周卡',
    price: '12.9',
    duration: '7天有效',
    tags: ['先体验', '低门槛'],
    benefits: [
      '解锁7天内全部比赛预测',
      '查看完整推荐理由与风险提示',
      '查看更多比分参考',
      '适合先体验内容质量',
    ],
    button: '先试7天',
    recommended: false,
    planHint: 'week',
  },
  {
    title: '世界杯通行证',
    price: '29.9',
    duration: '整届赛事有效',
    tags: ['推荐购买', '更划算', '世界杯期间畅看'],
    benefits: [
      '解锁世界杯期间全部比赛预测',
      '查看完整 AI 报告与每日推荐',
      '查看历史命中率详情',
      '解锁挑战赛高级榜单与荣誉排名',
    ],
    anchor: '不到3张周卡价格，直接畅看整届世界杯；一次开通，世界杯期间持续可用',
    button: '立即开通通行证',
    recommended: true,
    planHint: 'pass',
  },
];

const benefits = [
  {
    title: '解锁当天全部比赛预测',
    sub: '不只看1场，赛事当天全部比赛都可查看',
  },
  {
    title: '完整推荐理由与风险提示',
    sub: '查看完整推荐逻辑、风险等级与更多比分参考',
  },
  {
    title: '历史命中率公开归档',
    sub: '持续追踪分析表现，查看公开归档记录',
  },
  {
    title: '挑战赛高级榜单与荣誉排名',
    sub: '查看更多排行榜信息与挑战赛荣誉展示',
  },
];

const freeItems = [
  '可查看1场完整预测',
  '可查看部分推荐摘要',
  '无法查看当天全部比赛分析',
  '无法查看完整推荐理由',
  '无法查看高级榜单详情',
];

const memberItems = [
  '解锁全部比赛预测',
  '查看完整推荐理由与风险提示',
  '查看更多比分参考与分析细节',
  '查看历史命中率详情',
  '解锁挑战赛高级榜单与荣誉展示',
];

const reasons = [
  '所有预测公开归档，持续追踪分析表现',
  '当天比赛全覆盖更新，不止少数精选场次',
  '提供比分参考、风险等级与信心提示',
  '帮你更快看懂比赛，不用自己到处找信息',
];

onShow(load);

async function load() {
  try {
    plans.value = await api.membershipPlans();
  } catch {
    plans.value = [];
  }

  try {
    status.value = await api.membershipStatus();
  } catch {
    status.value = null;
  }
}

async function buyPricingCard(card: PricingCard, index: number) {
  if (status.value?.isMember) {
    uni.showToast({ title: '会员权益已生效', icon: 'none' });
    return;
  }

  const plan = findPlanForCard(card, index);
  if (!plan) {
    uni.showToast({ title: '会员方案加载中', icon: 'none' });
    return;
  }

  await buy(plan.id, card.planHint);
}

function findPlanForCard(card: PricingCard, index: number) {
  const matched = plans.value.find((plan) => {
    const text = `${plan.code || ''} ${plan.name || ''}`.toLowerCase();
    if (card.planHint === 'week') {
      return plan.durationDays === 7 || text.includes('week') || text.includes('周');
    }
    return (
      plan.durationDays > 7 ||
      text.includes('pass') ||
      text.includes('通行证') ||
      text.includes('worldcup') ||
      text.includes('世界杯')
    );
  });

  return matched || plans.value[index] || null;
}

async function buy(planId: string, planKind: PricingCard['planHint']) {
  if (!requireLogin()) return;
  if (paying.value) return;
  paying.value = true;
  try {
    const result = await api.createMembershipOrder(planId);
    if (result.mock) {
      uni.showToast({ title: '开发模式订单已创建', icon: 'none' });
      await pollOrder(result.order.id, planKind);
      return;
    }

    await requestPayment(result.payParams);
    uni.showToast({ title: '支付确认中', icon: 'none' });
    await pollOrder(result.order.id, planKind);
  } catch (error) {
    navigateResult(isPaymentCancel(error) ? 'cancelled' : 'failed', planKind);
  } finally {
    paying.value = false;
  }
}

function requestPayment(payParams: {
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
}) {
  return new Promise<void>((resolve, reject) => {
    uni.requestPayment({
      provider: 'wxpay',
      timeStamp: payParams.timeStamp,
      nonceStr: payParams.nonceStr,
      package: payParams.package,
      signType: payParams.signType,
      paySign: payParams.paySign,
      success: () => resolve(),
      fail: (error) => reject(new Error(error.errMsg || '支付未完成')),
    });
  });
}

async function pollOrder(orderId: string, planKind: PricingCard['planHint']) {
  for (let index = 0; index < 12; index += 1) {
    const order = await api.membershipOrderStatus(orderId);
    if (order.status === 'PAID') {
      status.value = await api.membershipStatus();
      setMembershipActivationTip(planKind);
      navigateResult('success', planKind);
      return;
    }
    await wait(2000);
  }

  uni.showToast({ title: '订单确认中，请稍后刷新', icon: 'none' });
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isPaymentCancel(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  return /cancel|取消/i.test(message);
}

function navigateResult(statusText: 'success' | 'failed' | 'cancelled', planKind: PricingCard['planHint']) {
  uni.navigateTo({
    url: `/pages/membership/result?status=${statusText}&type=${planKind}`,
  });
}

function benefitIcon(index: number) {
  return [
    ICON_ASSETS.aiReport,
    ICON_ASSETS.dailyPick,
    ICON_ASSETS.hitRate,
    ICON_ASSETS.ranking,
  ][index] || ICON_ASSETS.aiReport;
}
</script>

<style scoped lang="scss">
.membership-page {
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
.pass-hero,
.section-card,
.bottom-note {
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

.pass-hero,
.section-card {
  overflow: hidden;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 32rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
  box-shadow: 0 22rpx 62rpx rgba(0, 0, 0, 0.26);
}

.pass-hero {
  min-height: 500rpx;
  background: #101f46;
}

:deep(.hero-image),
.hero-shade {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.hero-shade {
  z-index: 1;
  background:
    radial-gradient(circle at 80% 0%, rgba(255, 216, 130, 0.22), transparent 32%),
    linear-gradient(120deg, rgba(5, 10, 26, 0.96), rgba(8, 20, 58, 0.9) 58%, rgba(80, 12, 42, 0.72));
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 42rpx 34rpx;
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.hero-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.hero-tags text {
  padding: 9rpx 14rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.2);
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.1);
  color: #ffe0a0;
  font-size: 20rpx;
  font-weight: 900;
}

.hero-title {
  margin-top: 18rpx;
  color: #ffffff;
  font-size: 58rpx;
  font-weight: 900;
  line-height: 1.08;
}

.hero-sub {
  margin-top: 14rpx;
  color: rgba(255, 242, 199, 0.94);
  font-size: 28rpx;
  font-weight: 900;
}

.hero-note {
  margin-top: 16rpx;
  max-width: 560rpx;
  color: rgba(221, 235, 255, 0.76);
  font-size: 24rpx;
  line-height: 1.45;
}

.pricing-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-weight: 900;
}

.section-card {
  margin-top: 28rpx;
  padding: 28rpx;
}

.active-card {
  border-color: rgba(43, 203, 136, 0.2);
  background:
    radial-gradient(circle at 92% 0%, rgba(43, 203, 136, 0.12), transparent 34%),
    rgba(8, 16, 38, 0.76);
}

.section-head {
  margin-bottom: 20rpx;
}

.section-title {
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 900;
  line-height: 1.2;
}

.compact {
  margin-top: 0;
}

.section-sub {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 22rpx;
  line-height: 1.45;
}

.pricing-section {
  border-color: rgba(255, 216, 130, 0.22);
  background:
    radial-gradient(circle at 90% 0%, rgba(255, 216, 130, 0.14), transparent 34%),
    rgba(8, 16, 38, 0.78);
}

.pricing-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18rpx;
  margin-top: 22rpx;
}

.pricing-card {
  position: relative;
  overflow: hidden;
  padding: 28rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 28rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(64, 134, 255, 0.16), transparent 34%),
    rgba(255, 255, 255, 0.07);
}

.pricing-card.recommended {
  border-color: rgba(255, 216, 130, 0.44);
  background:
    radial-gradient(circle at 88% 0%, rgba(255, 216, 130, 0.3), transparent 34%),
    linear-gradient(135deg, rgba(255, 216, 130, 0.16), rgba(64, 134, 255, 0.1));
  box-shadow: 0 22rpx 66rpx rgba(255, 216, 130, 0.14);
}

.pricing-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16rpx;
}

.pricing-title {
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 900;
  line-height: 1.2;
}

.recommended .pricing-title {
  font-size: 36rpx;
}

.pricing-duration {
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
  font-weight: 800;
}

.pricing-tags {
  display: flex;
  max-width: 250rpx;
  flex-shrink: 0;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8rpx;
}

.pricing-tag {
  padding: 8rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(221, 235, 255, 0.72);
  font-size: 19rpx;
  font-weight: 900;
}

.recommended .pricing-tag {
  background: rgba(255, 216, 130, 0.13);
  color: #ffd879;
}

.pricing-main {
  display: flex;
  align-items: flex-end;
  gap: 5rpx;
  margin-top: 24rpx;
  color: #ffd879;
}

.currency {
  margin-bottom: 9rpx;
  font-size: 36rpx;
  font-weight: 900;
}

.pricing-price {
  font-size: 78rpx;
  font-weight: 900;
  line-height: 1;
}

.recommended .pricing-price {
  font-size: 90rpx;
}

.price-unit {
  margin-bottom: 10rpx;
  color: rgba(255, 242, 199, 0.72);
  font-size: 22rpx;
  font-weight: 900;
}

.pricing-benefits {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 22rpx;
}

.pricing-benefit {
  position: relative;
  padding-left: 28rpx;
  color: rgba(247, 251, 255, 0.82);
  font-size: 22rpx;
  line-height: 1.42;
}

.pricing-benefit::before {
  position: absolute;
  top: 12rpx;
  left: 0;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #ffd879;
  box-shadow: 0 0 18rpx rgba(255, 216, 130, 0.42);
  content: '';
}

.pricing-anchor {
  margin-top: 18rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.28);
  border-radius: 18rpx;
  background: rgba(255, 216, 130, 0.08);
  color: #fff1c2;
  font-size: 22rpx;
  font-weight: 900;
  line-height: 1.4;
}

.pricing-btn {
  min-height: 82rpx;
  margin-top: 22rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  background: rgba(255, 216, 130, 0.1);
  color: #fff1c2;
  font-size: 25rpx;
}

.pricing-btn.primary {
  min-height: 92rpx;
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  font-size: 29rpx;
  box-shadow: 0 22rpx 64rpx rgba(255, 216, 121, 0.38);
}

.benefit-grid,
.compare-grid {
  display: grid;
  gap: 16rpx;
}

.benefit-grid {
  grid-template-columns: 1fr;
}

.benefit-card,
.compare-column,
.reason-item {
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
}

.benefit-card {
  display: grid;
  grid-template-columns: 62rpx 1fr;
  column-gap: 18rpx;
  padding: 22rpx;
  border-color: rgba(255, 216, 130, 0.14);
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.11), transparent 34%),
    rgba(255, 255, 255, 0.065);
}

.benefit-icon-wrap {
  display: flex;
  width: 62rpx;
  height: 62rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 216, 130, 0.14);
  border-radius: 20rpx;
  background: rgba(255, 216, 130, 0.12);
}

:deep(.benefit-icon) {
  width: 40rpx;
  height: 40rpx;
}

.benefit-title {
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
  line-height: 1.25;
}

.benefit-sub {
  grid-column: 2;
  margin-top: 8rpx;
  color: rgba(221, 235, 255, 0.58);
  font-size: 21rpx;
  line-height: 1.38;
}

.compare-grid {
  grid-template-columns: 1fr;
  margin-top: 22rpx;
}

.compare-column {
  padding: 22rpx;
}

.free-column {
  opacity: 0.72;
}

.member-column {
  border-color: rgba(255, 216, 130, 0.34);
  background:
    radial-gradient(circle at 94% 0%, rgba(255, 216, 130, 0.2), transparent 34%),
    linear-gradient(135deg, rgba(255, 216, 130, 0.1), rgba(64, 134, 255, 0.06));
  box-shadow: 0 18rpx 50rpx rgba(255, 216, 130, 0.08);
}

.compare-title {
  margin-bottom: 14rpx;
  color: #ffffff;
  font-size: 28rpx;
  font-weight: 900;
}

.compare-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10rpx;
  margin-bottom: 14rpx;
}

.compare-title-row .compare-title {
  margin-bottom: 0;
}

.compare-badge {
  padding: 7rpx 12rpx;
  border-radius: 999rpx;
  background: rgba(255, 216, 130, 0.13);
  color: #ffd879;
  font-size: 18rpx;
  font-weight: 900;
}

.compare-item {
  position: relative;
  margin-top: 12rpx;
  padding-left: 26rpx;
  color: rgba(221, 235, 255, 0.66);
  font-size: 22rpx;
  line-height: 1.45;
}

.compare-item::before {
  position: absolute;
  top: 12rpx;
  left: 0;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: rgba(221, 235, 255, 0.34);
  content: '';
}

.compare-item.strong {
  color: rgba(255, 242, 199, 0.9);
  font-weight: 800;
}

.compare-item.strong::before {
  background: #ffd879;
}

.reason-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12rpx;
  margin-top: 20rpx;
}

.reason-item {
  display: block;
  padding: 18rpx;
  color: rgba(247, 251, 255, 0.84);
  font-size: 22rpx;
  line-height: 1.45;
}

.reason-dot {
  width: 12rpx;
  height: 12rpx;
  margin-bottom: 12rpx;
  border-radius: 50%;
  background: #ffd879;
  box-shadow: 0 0 18rpx rgba(255, 216, 130, 0.45);
}

.bottom-note {
  margin-top: 28rpx;
  padding: 24rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.12);
  border-radius: 24rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.08), transparent 34%),
    rgba(0, 0, 0, 0.16);
  color: rgba(221, 235, 255, 0.54);
  font-size: 20rpx;
  line-height: 1.65;
}

.bottom-title {
  margin-bottom: 8rpx;
  color: #fff1c2;
  font-size: 25rpx;
  font-weight: 900;
}

@media (min-width: 900px) {
  .membership-page {
    padding: 34px max(34px, calc((100vw - 980px) / 2));
  }

  .benefit-grid,
  .compare-grid,
  .pricing-grid {
    grid-template-columns: 1fr 1fr;
  }

  .pricing-card.recommended {
    transform: translateY(-8rpx);
  }
}
</style>
