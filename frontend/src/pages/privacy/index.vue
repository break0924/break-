<template>
  <view class="legal-page">
    <view class="legal-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
    </view>

    <view class="legal-shell">
      <view class="legal-hero">
        <view class="eyebrow">Privacy</view>
        <view class="title">隐私政策</view>
        <view class="subtitle">本页面说明我们如何收集、使用和保护与你相关的必要信息。</view>
      </view>

      <view
        v-for="section in sections"
        :key="section.title"
        class="legal-card"
      >
        <view class="section-title">{{ section.title }}</view>
        <view
          v-for="item in section.items"
          :key="item"
          class="section-line"
        >
          {{ item }}
        </view>
      </view>

      <view class="bottom-note">
        我们仅在提供身份识别、权益同步、挑战记录和邀请统计等必要场景下使用相关信息。
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const sections = [
  {
    title: '一、我们可能收集的信息',
    items: [
      '账号识别信息：用于识别用户身份、同步登录状态和会员权益。',
      '使用记录信息：包括挑战赛提交记录、积分、排名、邀请码和邀请统计。',
      '设备与日志信息：用于排查异常、保障服务稳定性和基础安全。',
    ],
  },
  {
    title: '二、信息使用目的',
    items: [
      '用于完成登录识别、会员权益同步、挑战赛积分展示和邀请关系统计。',
      '用于优化内容展示、处理服务异常、保障账号和数据安全。',
    ],
  },
  {
    title: '三、信息存储与保护',
    items: [
      '我们会采用合理的技术和管理措施保护相关信息，避免未经授权的访问、披露或篡改。',
      '除法律法规要求或用户授权外，我们不会公开展示你的个人身份信息。',
    ],
  },
  {
    title: '四、信息共享',
    items: [
      '我们不会将你的个人信息用于与本产品无关的商业交易。',
      '如需使用第三方基础服务，将尽量限定在完成登录、支付、云存储或服务稳定所需范围内。',
    ],
  },
  {
    title: '五、用户权利',
    items: [
      '你可以在产品内查看账号、会员、挑战和邀请相关信息。',
      '如需查询、更正或删除相关信息，可通过产品提供的联系方式提交请求。',
    ],
  },
];
</script>

<style scoped lang="scss">
.legal-page {
  position: relative;
  min-height: 100vh;
  overflow: hidden;
  background:
    radial-gradient(circle at 16% 0%, rgba(64, 134, 255, 0.26), transparent 34%),
    radial-gradient(circle at 90% 8%, rgba(255, 216, 130, 0.16), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.legal-bg,
.legal-shell {
  position: relative;
  z-index: 1;
}

.glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
}

.glow-gold {
  top: -120rpx;
  right: -90rpx;
  width: 320rpx;
  height: 320rpx;
  background: rgba(255, 216, 130, 0.2);
}

.glow-blue {
  top: 300rpx;
  left: -110rpx;
  width: 300rpx;
  height: 300rpx;
  background: rgba(64, 134, 255, 0.18);
}

.legal-shell {
  padding: 28rpx;
}

.legal-hero,
.legal-card {
  border: 1rpx solid rgba(255, 255, 255, 0.11);
  border-radius: 30rpx;
  background: rgba(8, 16, 38, 0.76);
  box-shadow: 0 20rpx 58rpx rgba(0, 0, 0, 0.24);
}

.legal-hero {
  padding: 34rpx;
  border-color: rgba(255, 216, 130, 0.2);
  background:
    radial-gradient(circle at 90% 0%, rgba(255, 216, 130, 0.14), transparent 34%),
    rgba(8, 16, 38, 0.78);
}

.eyebrow {
  color: #ffd879;
  font-size: 22rpx;
  font-weight: 900;
}

.title {
  margin-top: 12rpx;
  color: #ffffff;
  font-size: 48rpx;
  font-weight: 900;
}

.subtitle {
  margin-top: 12rpx;
  color: rgba(221, 235, 255, 0.64);
  font-size: 24rpx;
  line-height: 1.55;
}

.legal-card {
  margin-top: 22rpx;
  padding: 28rpx;
}

.section-title {
  color: #ffd879;
  font-size: 29rpx;
  font-weight: 900;
}

.section-line {
  margin-top: 16rpx;
  color: rgba(237, 245, 255, 0.78);
  font-size: 24rpx;
  line-height: 1.62;
}

.bottom-note {
  margin: 24rpx 0 10rpx;
  padding: 20rpx 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 22rpx;
  background: rgba(0, 0, 0, 0.16);
  color: rgba(221, 235, 255, 0.48);
  font-size: 21rpx;
  line-height: 1.55;
}

@media (min-width: 900px) {
  .legal-shell {
    padding: 34px max(34px, calc((100vw - 900px) / 2));
  }
}
</style>
