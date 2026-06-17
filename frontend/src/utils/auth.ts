import { useAuthStore } from '../stores/auth';

export function requireLogin() {
  const auth = useAuthStore();
  auth.restore();

  if (!auth.isLoggedIn) {
    uni.navigateTo({ url: '/pages/login/index' });
    return false;
  }

  return true;
}

export function ensureMember() {
  const auth = useAuthStore();
  auth.restore();

  if (!auth.isMember) {
    uni.navigateTo({ url: '/pages/membership/index' });
    return false;
  }

  return true;
}
