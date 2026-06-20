import { callCloudContainer, canCallCloudContainer } from '../utils/cloudbase';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.API_BASE_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:3000/api');

type RequestOptions = UniApp.RequestOptions & {
  auth?: boolean;
  params?: Record<string, unknown>;
};

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export function buildQueryString(params?: Record<string, unknown>) {
  if (!params) {
    return '';
  }

  return Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(
      ([key, value]) =>
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
    )
    .join('&');
}

function appendQuery(url: string, params?: Record<string, unknown>) {
  const query = buildQueryString(params);
  if (!query) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}${query}`;
}

function toContainerPath(url: string, params?: Record<string, unknown>) {
  const path = appendQuery(url.startsWith('/api/') ? url : `/api${url}`, params);
  return path.replace(/\/{2,}/g, '/');
}

export function getApiBaseUrl() {
  const storedUrl = uni.getStorageSync('apiBaseUrl') || '';
  const url = storedUrl || API_BASE_URL;

  if (import.meta.env.PROD) {
    if (!url) {
      throw new Error('VITE_API_BASE_URL is required in production');
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?/i.test(url)) {
      throw new Error('Production API BaseURL cannot point to localhost');
    }
  }

  return url;
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

  if (canCallCloudContainer()) {
    const res = await callCloudContainer<T>({
      path: toContainerPath(options.url, options.params),
      method: String(options.method || 'GET'),
      header,
      data: options.data,
    });

    if (res.statusCode >= 200 && res.statusCode < 300) {
      return res.data as T;
    }

    const message =
      typeof res.data === 'object' && res.data && 'message' in res.data
        ? String((res.data as { message: unknown }).message)
        : '请求失败';

    if (res.statusCode === 401) {
      uni.removeStorageSync('accessToken');
      uni.removeStorageSync('userProfile');
    }

    throw new ApiRequestError(message, res.statusCode);
  }

  return new Promise<T>((resolve, reject) => {
    uni.request({
      ...options,
      url: `${getApiBaseUrl()}${appendQuery(options.url, options.params)}`,
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

        reject(new ApiRequestError(message, res.statusCode));
      },
      fail: (error) => reject(new Error(error.errMsg || '网络异常')),
    });
  });
}
