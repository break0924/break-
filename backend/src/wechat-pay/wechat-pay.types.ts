export type WechatJsapiPayParams = {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA';
  paySign: string;
};

export type WechatCreateOrderResult = {
  prepayId: string;
  payParams: WechatJsapiPayParams;
  mock: boolean;
};

export type WechatPaymentNotification = {
  event_type: string;
  resource?: {
    associated_data?: string;
    nonce: string;
    ciphertext: string;
  };
};

export type WechatPaymentResource = {
  appid: string;
  mchid: string;
  out_trade_no: string;
  transaction_id?: string;
  trade_state: string;
  success_time?: string;
};
