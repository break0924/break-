import { PaymentStatus } from '@prisma/client';
import { WechatJsapiPayParams } from '../../wechat-pay/wechat-pay.types';

export type MembershipPaymentOrderResponse = {
  order: {
    id: string;
    orderNo: string;
    amountCents: number;
    status: PaymentStatus;
    paidAt: Date | null;
  };
  payParams: WechatJsapiPayParams;
  mock: boolean;
};
