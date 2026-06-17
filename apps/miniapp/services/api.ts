const BASE_URL = 'http://localhost:3000/api/v1';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  data?: unknown;
};

export function request<T>(url: string, options: RequestOptions = {}) {
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method: options.method ?? 'GET',
      data: options.data,
      success(response) {
        const body = response.data as { code: number; message: string; data: T };
        if (body.code === 0) {
          resolve(body.data);
          return;
        }
        reject(new Error(body.message));
      },
      fail: reject
    });
  });
}
