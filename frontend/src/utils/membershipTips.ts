import {
  membershipArrivalTips,
  type MembershipPlanKind,
} from '../config/membershipCopy';

type MembershipTipPage = 'home' | 'today' | 'me';

const MEMBERSHIP_TIP_KEY = 'membershipActivationTip';

export function setMembershipActivationTip(planKind: MembershipPlanKind) {
  uni.setStorageSync(MEMBERSHIP_TIP_KEY, {
    planKind,
    createdAt: Date.now(),
  });
}

export function consumeMembershipActivationTip(page: MembershipTipPage) {
  const payload = uni.getStorageSync(MEMBERSHIP_TIP_KEY);
  if (!payload) {
    return false;
  }

  uni.removeStorageSync(MEMBERSHIP_TIP_KEY);

  const title = tipTextForPage(page);
  uni.showToast({
    title,
    icon: 'none',
    duration: 2600,
  });
  return true;
}

function tipTextForPage(page: MembershipTipPage) {
  if (page === 'today') {
    return membershipArrivalTips.today[0];
  }
  if (page === 'me') {
    return membershipArrivalTips.me.subtitle;
  }
  return membershipArrivalTips.home[0];
}
