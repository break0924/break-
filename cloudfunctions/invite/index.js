const { ok, fail } = require('../common/response');
const { ensureUser, getInviteStatus, getOpenId } = require('../common/db');

exports.main = async () => {
  try {
    const openid = await getOpenId();
    const user = await ensureUser(openid);
    return ok(await getInviteStatus(user));
  } catch (error) {
    return fail(error.message || '邀请数据读取失败');
  }
};
