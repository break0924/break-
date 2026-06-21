<template>
  <view v-if="visible" class="chat-mask" @tap="close">
    <view class="chat-panel" @tap.stop>
      <view class="chat-header">
        <view>
          <view class="chat-title">球迷聊天室</view>
          <view class="chat-tip">理性聊球，禁止广告、引流、博彩、投注等内容。</view>
        </view>
        <view class="chat-close" @tap="close">关闭</view>
      </view>

      <scroll-view class="chat-list" scroll-y>
        <view v-if="loading" class="chat-empty">正在加载聊天消息...</view>
        <view v-else-if="messages.length === 0" class="chat-empty">
          还没人发言，来聊第一句吧
        </view>
        <template v-else>
          <view v-for="item in messages" :key="item.id" class="chat-message">
            <view class="message-avatar">
              <image v-if="item.avatarUrl" :src="item.avatarUrl" mode="aspectFill" />
              <text v-else>{{ item.nickname.slice(0, 1) || '球' }}</text>
            </view>
            <view class="message-body">
              <view class="message-meta">
                <text class="message-name">{{ item.nickname || '球迷' }}</text>
                <text class="message-time">{{ formatTime(item.createdAt) }}</text>
              </view>
              <view class="message-content">{{ item.content }}</view>
            </view>
          </view>
        </template>
      </scroll-view>

      <view class="chat-input-row">
        <input
          v-model="content"
          class="chat-input"
          maxlength="100"
          confirm-type="send"
          placeholder="聊聊比赛，但别发广告和违规内容"
          @confirm="send"
        />
        <button class="chat-send" :disabled="sending" @tap="send">
          {{ sending ? '发送中' : '发送' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import { api } from '../../../api';
import type { ChatMessage } from '../../../api/types';

const props = defineProps<{
  visible: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const messages = ref<ChatMessage[]>([]);
const content = ref('');
const loading = ref(false);
const sending = ref(false);
let timer: ReturnType<typeof setInterval> | undefined;

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      void refreshMessages();
      startPolling();
      return;
    }

    stopPolling();
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  stopPolling();
});

function close() {
  emit('close');
}

function startPolling() {
  stopPolling();
  timer = setInterval(() => {
    void refreshMessages(false);
  }, 8000);
}

function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

async function refreshMessages(showLoading = true) {
  if (showLoading) {
    loading.value = true;
  }

  try {
    messages.value = await api.chatMessages();
  } catch {
    uni.showToast({ title: '聊天消息加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
}

async function send() {
  const text = content.value.trim();
  if (!text) {
    uni.showToast({ title: '请输入聊天内容', icon: 'none' });
    return;
  }

  if (sending.value) {
    return;
  }

  sending.value = true;
  try {
    const profile = uni.getStorageSync('userProfile') || {};
    const result = await api.sendChatMessage({
      content: text,
      nickname: profile.nickname || '球迷',
      avatarUrl: profile.avatarUrl,
    });

    if (!result.success) {
      uni.showToast({
        title: typeof result.message === 'string' ? result.message : '发送失败',
        icon: 'none',
      });
      return;
    }

    content.value = '';
    await refreshMessages(false);
  } catch (error) {
    const message = error instanceof Error ? error.message : '发送失败';
    uni.showToast({ title: message, icon: 'none' });
  } finally {
    sending.value = false;
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${hour}:${minute}`;
}
</script>

<style scoped lang="scss">
.chat-mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: flex-end;
  background: rgba(0, 0, 0, 0.46);
}

.chat-panel {
  width: 100%;
  max-height: 72vh;
  box-sizing: border-box;
  padding: 26rpx 26rpx 30rpx;
  border: 1rpx solid rgba(255, 216, 130, 0.18);
  border-radius: 32rpx 32rpx 0 0;
  background:
    radial-gradient(circle at 20% 0%, rgba(64, 134, 255, 0.24), transparent 34%),
    linear-gradient(180deg, rgba(9, 22, 53, 0.98), rgba(4, 9, 24, 0.98));
  box-shadow: 0 -22rpx 70rpx rgba(0, 0, 0, 0.42);
}

.chat-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
}

.chat-title {
  color: #fff6d8;
  font-size: 34rpx;
  font-weight: 900;
}

.chat-tip {
  margin-top: 8rpx;
  color: rgba(214, 229, 255, 0.58);
  font-size: 21rpx;
  line-height: 1.45;
}

.chat-close {
  flex-shrink: 0;
  padding: 10rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: rgba(247, 251, 255, 0.75);
  font-size: 22rpx;
}

.chat-list {
  height: 54vh;
  margin-top: 24rpx;
  padding-right: 4rpx;
  box-sizing: border-box;
}

.chat-empty {
  padding: 90rpx 20rpx;
  text-align: center;
  color: rgba(214, 229, 255, 0.55);
  font-size: 24rpx;
}

.chat-message {
  display: flex;
  gap: 16rpx;
  padding: 16rpx 0;
}

.message-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54rpx;
  height: 54rpx;
  overflow: hidden;
  border: 1rpx solid rgba(255, 216, 130, 0.22);
  border-radius: 50%;
  background: rgba(255, 216, 130, 0.14);
  color: #ffe0a0;
  font-size: 22rpx;
  font-weight: 900;
}

.message-avatar image {
  width: 100%;
  height: 100%;
}

.message-body {
  flex: 1;
  min-width: 0;
}

.message-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.message-name {
  color: rgba(247, 251, 255, 0.86);
  font-size: 22rpx;
  font-weight: 800;
}

.message-time {
  color: rgba(214, 229, 255, 0.38);
  font-size: 19rpx;
}

.message-content {
  display: inline-block;
  max-width: 100%;
  margin-top: 8rpx;
  padding: 14rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.07);
  color: rgba(247, 251, 255, 0.9);
  font-size: 25rpx;
  line-height: 1.45;
  word-break: break-word;
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 18rpx;
}

.chat-input {
  flex: 1;
  height: 76rpx;
  padding: 0 22rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.12);
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.08);
  color: #f7fbff;
  font-size: 24rpx;
}

.chat-send {
  width: 132rpx;
  height: 76rpx;
  margin: 0;
  padding: 0;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #f6c658, #fff0b7);
  color: #08101e;
  font-size: 24rpx;
  font-weight: 900;
  line-height: 76rpx;
}

.chat-send[disabled] {
  opacity: 0.65;
}
</style>
