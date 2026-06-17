const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.API_BASE_URL ||
  'http://localhost:3000/api';

type RequestOptions = UniApp.RequestOptions & {
  auth?: boolean;
};

export function getApiBaseUrl() {
  return uni.getStorageSync('apiBaseUrl') || API_BASE_URL;
}

export function setApiBaseUrl(url: string) {
  uni.setStorageSync('apiBaseUrl', url);
}

export async function request<T>(options: RequestOptions): Promise<T> {
  const token = uni.getStorageSync('accessToken');
  const header: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.header as Record<string, string> | undefined),
  };

  if (token) {
    header.Authorization = `Bearer ${token}`;
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      url: `${getApiBaseUrl()}${options.url}`,
      header,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
          return;
        }

        const message =
          typeof res.data === 'object' && res.data && 'message' in res.data
            ? String((res.data as { message: unknown }).message)
            : '请求失败';

        if (res.statusCode === 401) {
          uni.removeStorageSync('accessToken');
          uni.removeStorageSync('userProfile');
        }

        reject(new Error(message));
      },
      fail: (error) => reject(new Error(error.errMsg || '网络异常')),
    });
  });
}
