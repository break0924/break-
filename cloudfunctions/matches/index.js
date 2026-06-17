const { ok, fail } = require('../common/response');
const { loadHomeData } = require('../common/home');

exports.main = async (event = {}) => {
  try {
    const data = await loadHomeData({ date: event.params?.date || event.date });
    return ok(data.matches);
  } catch (error) {
    return fail(error.message || '赛程数据读取失败');
  }
};
