const { ok, fail } = require('../common/response');
const { ensureUser, getMembership, getOpenId } = require('../common/db');

exports.main = async () => {
  try {
    const openid = await getOpenId();
    const user = await ensureUser(openid);
    return ok(await getMembership(user));
  } catch (error) {
    return fail(error.message || '会员状态读取失败');
  }
};
