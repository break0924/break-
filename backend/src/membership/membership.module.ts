import { Module } from '@nestjs/common';
import { WechatPayModule } from '../wechat-pay/wechat-pay.module';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { WechatPayNotifyController } from './wechat-pay-notify.controller';

@Module({
  imports: [WechatPayModule],
  controllers: [MembershipController, WechatPayNotifyController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
