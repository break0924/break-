const { ok, fail } = require('../common/response');
const { loadHomeData } = require('../common/home');

exports.main = async (event = {}) => {
  try {
    return ok(await loadHomeData({ date: event.date }));
  } catch (error) {
    return fail(error.message || '首页数据读取失败');
  }
};
