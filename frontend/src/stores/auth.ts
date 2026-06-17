import { defineStore } from 'pinia';
import { api } from '../api';
import type { UserProfile } from '../api/types';

type AuthState = {
  token: string;
  user: UserProfile | null;
};

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: '',
    user: null,
  }),
  getters: {
    isLoggedIn: (state) => Boolean(state.token && state.user),
    isMember: (state) => Boolean(state.user?.isMember),
  },
  actions: {
    restore() {
      this.token = uni.getStorageSync('accessToken') || '';
      this.user = uni.getStorageSync('userProfile') || null;
    },
    async loginWithWeChatProfile(profile?: {
      nickname?: string;
      avatarUrl?: string;
    }) {
      const loginResult = await new Promise<UniApp.LoginRes>((resolve, reject) => {
        uni.login({
          provider: 'weixin',
          success: resolve,
          fail: reject,
        });
      });

      const openId = `dev_${loginResult.code || Date.now()}`;
      const result = await api.login({
        openId,
        nickname: profile?.nickname || '世界杯用户',
        avatarUrl: profile?.avatarUrl,
      });

      this.token = result.accessToken;
      this.user = result.user;
      uni.setStorageSync('accessToken', result.accessToken);
      uni.setStorageSync('userProfile', result.user);
      return result.user;
    },
    async refreshMe() {
      if (!this.token) return null;
      const user = await api.me();
      this.user = user;
      uni.setStorageSync('userProfile', user);
      return user;
    },
    logout() {
      this.token = '';
      this.user = null;
      uni.removeStorageSync('accessToken');
      uni.removeStorageSync('userProfile');
    },
  },
});
