function request(path, { method = 'GET', data = {} } = {}) {
  const app = getApp();
  const base = app.globalData.apiBase;
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${base}${path}`,
      method,
      data,
      header: { 'content-type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(new Error(res.data?.error || '请求失败'));
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
}

module.exports = { request };
