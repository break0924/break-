<template>
  <view class="result-page">
    <view class="page-bg">
      <view class="glow glow-gold" />
      <view class="glow glow-blue" />
      <view class="motion-line line-a" />
      <view class="motion-line line-b" />
    </view>

    <section class="result-card" :class="resultStatus">
      <view class="result-icon">{{ iconText }}</view>
      <view class="result-title">{{ pageTitle }}</view>
      <view class="result-subtitle">{{ pageSubtitle }}</view>

      <view v-if="isSuccess" class="status-box">
        <view
          v-for="row in successCopy.statusRows"
          :key="row.label"
          class="status-row"
        >
          <text>{{ row.label }}</text>
          <text>{{ row.value }}</text>
        </view>
      </view>

      <view v-if="isSuccess" class="benefit-box">
        <view class="box-title">权益说明</view>
        <view
          v-for="item in successCopy.benefits"
          :key="item.label"
          class="benefit-row"
        >
          <text>{{ item.label }}</text>
          <text>{{ item.value }}</text>
        </view>
      </view>

      <view class="action-row">
        <view class="primary-action" @tap="handlePrimary">{{ primaryButton }}</view>
        <view class="secondary-action" @tap="handleSecondary">{{ secondaryButton }}</view>
      </view>
    </section>
  </view>
</template>

<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import {
  membershipFailureCopy,
  membershipSuccessCopy,
  type MembershipPlanKind,
  type MembershipResultStatus,
} from '../../config/membershipCopy';

const resultStatus = ref<MembershipResultStatus>('success');
const planKind = ref<MembershipPlanKind>('pass');

const isSuccess = computed(() => resultStatus.value === 'success');
const successCopy = computed(() => membershipSuccessCopy[planKind.value]);
const failureCopy = computed(() =>
  resultStatus.value === 'cancelled'
    ? membershipFailureCopy.cancelled
    : membershipFailureCopy.failed,
);
const pageTitle = computed(() =>
  isSuccess.value ? successCopy.value.title : failureCopy.value.title,
);
const pageSubtitle = computed(() =>
  isSuccess.value ? successCopy.value.subtitle : failureCopy.value.subtitle,
);
const primaryButton = computed(() =>
  isSuccess.value ? successCopy.value.primaryButton : failureCopy.value.primaryButton,
);
const secondaryButton = computed(() =>
  isSuccess.value ? successCopy.value.secondaryButton : failureCopy.value.secondaryButton,
);
const iconText = computed(() => {
  if (resultStatus.value === 'success') return '✓';
  if (resultStatus.value === 'cancelled') return '…';
  return '!';
});

onLoad((query) => {
  applyQuery(query);
});

onShow(() => {
  applyQuery(readCurrentQuery());
});

onMounted(() => {
  syncRouteQuery();
  // #ifdef H5
  window.addEventListener('hashchange', syncRouteQuery);
  // #endif
});

onBeforeUnmount(() => {
  // #ifdef H5
  window.removeEventListener('hashchange', syncRouteQuery);
  // #endif
});

function syncRouteQuery() {
  applyQuery(readCurrentQuery());
}

function applyQuery(query?: Record<string, unknown>) {
  const status = String(query?.status || 'success') as MembershipResultStatus;
  const type = String(query?.type || 'pass') as MembershipPlanKind;
  resultStatus.value = ['success', 'failed', 'cancelled'].includes(status) ? status : 'success';
  planKind.value = type === 'week' ? 'week' : 'pass';
}

function readCurrentQuery() {
  const pages = getCurrentPages();
  const current = pages[pages.length - 1] as unknown as {
    options?: Record<string, unknown>;
    $page?: { options?: Record<string, unknown> };
  };
  const options = current?.options || current?.$page?.options || {};

  // #ifdef H5
  const hashQuery: Record<string, string> = {};
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.hash.split('?')[1] || '');
    params.forEach((value, key) => {
      hashQuery[key] = value;
    });
  }
  return { ...options, ...hashQuery };
  // #endif

  // #ifndef H5
  return options;
  // #endif
}

function handlePrimary() {
  if (resultStatus.value === 'success') {
    uni.switchTab({ url: '/pages/today/index' });
    return;
  }

  if (resultStatus.value === 'cancelled') {
    uni.switchTab({ url: '/pages/index/index' });
    return;
  }

  uni.redirectTo({ url: '/pages/membership/index' });
}

function handleSecondary() {
  if (resultStatus.value === 'success') {
    if (planKind.value === 'week') {
      uni.redirectTo({ url: '/pages/membership/index' });
      return;
    }
    uni.switchTab({ url: '/pages/challenge/index' });
    return;
  }

  uni.redirectTo({ url: '/pages/membership/index' });
}
</script>

<style scoped lang="scss">
.result-page {
  position: relative;
  overflow: hidden;
  min-height: 100vh;
  padding: 34rpx 28rpx;
  background:
    radial-gradient(circle at 15% 0%, rgba(64, 134, 255, 0.3), transparent 34%),
    radial-gradient(circle at 88% 7%, rgba(255, 216, 130, 0.2), transparent 30%),
    linear-gradient(180deg, #06122b 0%, #050a18 58%, #071314 100%);
  color: #f7fbff;
}

.page-bg,
.result-card {
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

.result-card {
  overflow: hidden;
  padding: 40rpx 32rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.24);
  border-radius: 34rpx;
  background:
    radial-gradient(circle at 92% 0%, rgba(255, 216, 130, 0.16), transparent 34%),
    rgba(8, 16, 38, 0.78);
  box-shadow: 0 22rpx 62rpx rgba(0, 0, 0, 0.28);
}

.result-card.failed,
.result-card.cancelled {
  border-color: rgba(255, 255, 255, 0.12);
  background:
    radial-gradient(circle at 92% 0%, rgba(64, 134, 255, 0.14), transparent 34%),
    rgba(8, 16, 38, 0.78);
}

.result-icon {
  display: flex;
  width: 104rpx;
  height: 104rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 216, 130, 0.28);
  border-radius: 32rpx;
  background: rgba(255, 216, 130, 0.12);
  color: #ffd879;
  font-size: 58rpx;
  font-weight: 900;
}

.failed .result-icon,
.cancelled .result-icon {
  border-color: rgba(64, 134, 255, 0.22);
  background: rgba(64, 134, 255, 0.12);
  color: #bcd4ff;
}

.result-title {
  margin-top: 28rpx;
  color: #ffffff;
  font-size: 46rpx;
  font-weight: 900;
  line-height: 1.16;
}

.result-subtitle {
  margin-top: 14rpx;
  color: rgba(221, 235, 255, 0.66);
  font-size: 24rpx;
  line-height: 1.5;
}

.status-box,
.benefit-box {
  margin-top: 28rpx;
  padding: 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.06);
}

.box-title {
  margin-bottom: 14rpx;
  color: #ffd879;
  font-size: 24rpx;
  font-weight: 900;
}

.status-row,
.benefit-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding: 14rpx 0;
  color: rgba(221, 235, 255, 0.68);
  font-size: 22rpx;
  line-height: 1.35;
}

.status-row + .status-row,
.benefit-row + .benefit-row {
  border-top: 1rpx solid rgba(255, 255, 255, 0.07);
}

.status-row text:last-child,
.benefit-row text:last-child {
  color: #ffd879;
  font-weight: 900;
}

.action-row {
  display: flex;
  gap: 16rpx;
  margin-top: 34rpx;
}

.primary-action,
.secondary-action {
  display: flex;
  min-height: 84rpx;
  flex: 1;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-size: 25rpx;
  font-weight: 900;
}

.primary-action {
  background-image: linear-gradient(135deg, #ffd36f, #fff0b6);
  color: #07101d;
  box-shadow: 0 18rpx 54rpx rgba(255, 216, 121, 0.28);
}

.secondary-action {
  border: 1rpx solid rgba(255, 216, 130, 0.2);
  background: rgba(255, 255, 255, 0.07);
  color: rgba(255, 242, 199, 0.86);
}

@media (min-width: 900px) {
  .result-page {
    padding: 46px max(34px, calc((100vw - 760px) / 2));
  }
}
</style>
