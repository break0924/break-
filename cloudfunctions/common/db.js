const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const _ = db.command;

function todayInShanghai() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map((item) => [item.type, item.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

async function getOpenId() {
  const context = cloud.getWXContext();
  return context.OPENID || 'dev-openid';
}

function makeInviteCode(openid) {
  const source = String(openid || 'guest').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  return `WC26${source || 'AI88'}`;
}

async function ensureUser(openid) {
  const userResult = await db.collection('users').where({ openId: openid }).limit(1).get();
  if (userResult.data[0]) {
    return userResult.data[0];
  }

  const now = new Date();
  const user = {
    openId: openid,
    nickname: '',
    avatarUrl: '',
    membershipStatus: 'NONE',
    membershipExpireAt: null,
    inviteCode: makeInviteCode(openid),
    inviterId: null,
    createdAt: now,
    updatedAt: now,
  };
  const created = await db.collection('users').add({ data: user });
  return {
    _id: created._id,
    ...user,
  };
}

async function getMembership(user) {
  const isMember =
    user.membershipStatus === 'ACTIVE' &&
    (!user.membershipExpireAt || new Date(user.membershipExpireAt).getTime() > Date.now());

  return {
    userId: user._id,
    membershipStatus: isMember ? 'ACTIVE' : user.membershipStatus || 'NONE',
    membershipExpireAt: user.membershipExpireAt || null,
    isMember,
    benefits: [
      '查看完整AI报告',
      '查看今日全部比赛预测',
      '查看历史命中率详情',
      '查看挑战赛高级榜单',
    ],
  };
}

async function getInviteStatus(user) {
  const statsResult = await db.collection('invite_stats').where({ userId: user._id }).limit(1).get();
  const stats = statsResult.data[0] || {};
  return {
    inviteCode: user.inviteCode || makeInviteCode(user.openId),
    inviterId: user.inviterId || null,
    invitedCount: stats.invitedCount || 0,
    invitedPaidCount: stats.invitedPaidCount || 0,
  };
}

module.exports = {
  cloud,
  db,
  _,
  todayInShanghai,
  getOpenId,
  ensureUser,
  getMembership,
  getInviteStatus,
};
