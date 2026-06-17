<template>
  <view class="legal-page">
    <view class="legal-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
    </view>

    <view class="legal-shell">
      <view class="legal-hero">
        <view class="eyebrow">Agreement</view>
        <view class="title">用户协议</view>
        <view class="subtitle">请在使用 AI世界杯预测官 前阅读并理解本协议内容。</view>
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
        AI分析仅供足球赛事数据参考，不构成确定性结果承诺；挑战赛仅展示虚拟积分、称号与排行榜。
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const sections = [
  {
    title: '一、服务内容',
    items: [
      '本产品提供足球赛事数据分析、AI赛前情报、每日推荐内容、挑战赛积分与会员内容解锁服务。',
      '会员权益以页面展示为准，开通后可在对应有效期内查看完整内容。',
    ],
  },
  {
    title: '二、账号使用',
    items: [
      '用户可通过微信能力完成身份识别，用于同步会员权益、挑战记录、邀请码与个人中心数据。',
      '请妥善使用账号，不得通过异常方式干扰排行榜、挑战赛积分或服务秩序。',
    ],
  },
  {
    title: '三、内容使用',
    items: [
      'AI分析内容基于公开信息、模型判断和数据整理生成，仅供足球赛事阅读与信息参考。',
      '用户应结合自身判断理性阅读，不应将内容理解为确定性结果承诺。',
    ],
  },
  {
    title: '四、挑战赛规则',
    items: [
      '挑战赛仅展示虚拟积分、称号、排名和活动礼物说明，不设置现金奖励。',
      '如发现异常账号、刷号、作弊或违规行为，平台可取消相关活动资格。',
    ],
  },
  {
    title: '五、协议更新',
    items: [
      '我们可能根据产品功能和运营需要更新协议内容，更新后将在页面中展示。',
      '继续使用本产品，即表示你已阅读并同意更新后的协议内容。',
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
