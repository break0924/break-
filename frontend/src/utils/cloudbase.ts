type CloudFunctionResult<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

const CLOUD_REQUEST_TIMEOUT_MS = 15000;

declare const wx: {
  cloud?: {
    init(options: { env?: string; traceUser?: boolean }): void;
    callContainer<T = unknown>(options: {
      config: { env?: string };
      path: string;
      method?: string;
      header?: Record<string, string>;
      data?: unknown;
      timeout?: number;
      success?: (res: { statusCode?: number; data: T }) => void;
      fail?: (error: { errMsg?: string }) => void;
    }): void;
    callFunction<T = unknown>(options: {
      name: string;
      data?: Record<string, unknown>;
      timeout?: number;
      success?: (res: { result: T }) => void;
      fail?: (error: { errMsg?: string }) => void;
    }): void;
  };
};

export const CLOUDBASE_ENV =
  import.meta.env.VITE_CLOUDBASE_ENV ||
  import.meta.env.CLOUDBASE_ENV ||
  '';

export const CLOUD_CONTAINER_SERVICE =
  import.meta.env.VITE_CLOUD_CONTAINER_SERVICE ||
  'worldcup-api';

let initialized = false;

export function isCloudbaseEnabled() {
  const source =
    import.meta.env.VITE_DATA_SOURCE ||
    import.meta.env.DATA_SOURCE ||
    '';
  if (import.meta.env.PROD && source === 'cloudbase' && !CLOUDBASE_ENV) {
    throw new Error('VITE_CLOUDBASE_ENV is required when CloudBase is enabled');
  }
  return source === 'cloudbase';
}

export function initCloudbase() {
  if (initialized || typeof wx === 'undefined' || !wx.cloud) {
    return;
  }

  wx.cloud.init({
    env: CLOUDBASE_ENV || undefined,
    traceUser: true,
  });
  initialized = true;
}

export async function callCloudFunction<T>(
  name: string,
  data: Record<string, unknown> = {},
  timeout = CLOUD_REQUEST_TIMEOUT_MS,
): Promise<T> {
  initCloudbase();

  if (typeof wx === 'undefined' || !wx.cloud) {
    throw new Error('云开发环境未初始化');
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      console.error('callFunction failed:', name, 'timeout');
      reject(new Error('云函数请求超时'));
    }, timeout);

    wx.cloud?.callFunction<CloudFunctionResult<T>>({
      name,
      data,
      timeout,
      success: (res) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        const result = res.result;
        if (result?.success === false) {
          reject(new Error(result.error?.message || '云函数请求失败'));
          return;
        }

        resolve((result?.data ?? result) as T);
      },
      fail: (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        console.error('callFunction failed:', name, error);
        reject(new Error(error.errMsg || '云函数请求失败'));
      },
    });
  });
}

export function canCallCloudContainer() {
  return typeof wx !== 'undefined' && Boolean(wx.cloud?.callContainer);
}

export async function callCloudContainer<T>(options: {
  path: string;
  method?: string;
  header?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}): Promise<{ statusCode: number; data: T }> {
  initCloudbase();

  if (!canCallCloudContainer()) {
    throw new Error('云托管调用环境不可用');
  }

  if (import.meta.env.PROD && !CLOUDBASE_ENV) {
    throw new Error('VITE_CLOUDBASE_ENV is required for CloudBase container calls');
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    const timeout = options.timeout ?? CLOUD_REQUEST_TIMEOUT_MS;
    const timer = setTimeout(() => {
      if (settled) {
        return;
      }
      settled = true;
      console.error('callContainer failed:', options.path, 'timeout');
      reject(new Error('云托管请求超时'));
    }, timeout);

    wx.cloud?.callContainer<T>({
      config: {
        env: CLOUDBASE_ENV || undefined,
      },
      path: options.path,
      method: options.method || 'GET',
      timeout,
      header: {
        'X-WX-SERVICE': CLOUD_CONTAINER_SERVICE,
        ...(options.header || {}),
      },
      data: options.data,
      success: (res) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        resolve({
          statusCode: res.statusCode || 200,
          data: res.data,
        });
      },
      fail: (error) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        console.error('callContainer failed:', options.path, error);
        reject(new Error(error.errMsg || '云托管请求失败'));
      },
    });
  });
}
