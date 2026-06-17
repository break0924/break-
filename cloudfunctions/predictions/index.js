const { ok, fail } = require('../common/response');
const { loadHomeData } = require('../common/home');

exports.main = async (event = {}) => {
  try {
    const data = await loadHomeData({ date: event.date });

    if (event.action === 'stats') {
      return ok(data.stats);
    }

    return ok({
      source: 'cloudbase',
      date: data.date,
      predictions: data.predictions,
    });
  } catch (error) {
    return fail(error.message || '预测数据读取失败');
  }
};
