type CloudFunctionResult<T> = {
  success?: boolean;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

declare const wx: {
  cloud?: {
    init(options: { env?: string; traceUser?: boolean }): void;
    callFunction<T = unknown>(options: {
      name: string;
      data?: Record<string, unknown>;
      success?: (res: { result: T }) => void;
      fail?: (error: { errMsg?: string }) => void;
    }): void;
  };
};

const CLOUDBASE_ENV =
  import.meta.env.VITE_CLOUDBASE_ENV ||
  import.meta.env.CLOUDBASE_ENV ||
  '';

let initialized = false;

export function isCloudbaseEnabled() {
  const source =
    import.meta.env.VITE_DATA_SOURCE ||
    import.meta.env.DATA_SOURCE ||
    '';
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
): Promise<T> {
  initCloudbase();

  if (typeof wx === 'undefined' || !wx.cloud) {
    throw new Error('云开发环境未初始化');
  }

  return new Promise<T>((resolve, reject) => {
    wx.cloud?.callFunction<CloudFunctionResult<T>>({
      name,
      data,
      success: (res) => {
        const result = res.result;
        if (result?.success === false) {
          reject(new Error(result.error?.message || '云函数请求失败'));
          return;
        }

        resolve((result?.data ?? result) as T);
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '云函数请求失败'));
      },
    });
  });
}
