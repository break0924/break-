import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WechatPayService } from '../wechat-pay/wechat-pay.service';
import { WechatPaymentNotification } from '../wechat-pay/wechat-pay.types';
import { MembershipService } from './membership.service';

@Controller('wechat-pay')
export class WechatPayNotifyController {
  constructor(
    private readonly membershipService: MembershipService,
    private readonly wechatPayService: WechatPayService,
  ) {}

  @Post('notify')
  async notify(
    @Body() body: WechatPaymentNotification,
    @Headers('wechatpay-timestamp') timestamp: string | undefined,
    @Headers('wechatpay-nonce') nonce: string | undefined,
    @Headers('wechatpay-signature') signature: string | undefined,
    @Req() request: Request & { rawBody?: Buffer },
  ) {
    this.wechatPayService.verifyNotificationSignature({
      timestamp,
      nonce,
      signature,
      rawBody: request.rawBody,
    });
    const resource = this.wechatPayService.decryptNotification(body);
    await this.membershipService.activateByPaymentNotification(resource);

    return { code: 'SUCCESS', message: '成功' };
  }
}
