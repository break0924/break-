import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createDecipheriv, createSign, createVerify, randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import {
  WechatCreateOrderResult,
  WechatPaymentNotification,
  WechatPaymentResource,
} from './wechat-pay.types';

@Injectable()
export class WechatPayService {
  constructor(private readonly configService: ConfigService) {}

  async createJsapiOrder(input: {
    orderNo: string;
    description: string;
    amountCents: number;
    payerOpenId: string;
  }): Promise<WechatCreateOrderResult> {
    if (!this.isConfigured()) {
      const prepayId = `mock_prepay_${input.orderNo}`;
      return {
        prepayId,
        payParams: this.buildPayParams(prepayId),
        mock: true,
      };
    }

    const body = {
      appid: this.appId,
      mchid: this.mchId,
      description: input.description,
      out_trade_no: input.orderNo,
      notify_url: this.notifyUrl,
      amount: {
        total: input.amountCents,
        currency: 'CNY',
      },
      payer: {
        openid: input.payerOpenId,
      },
    };
    const path = '/v3/pay/transactions/jsapi';
    const response = await fetch(`https://api.mch.weixin.qq.com${path}`, {
      method: 'POST',
      headers: {
        Authorization: this.buildAuthorization('POST', path, JSON.stringify(body)),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BadRequestException(`Wechat Pay order failed: ${response.status}`);
    }

    const data = (await response.json()) as { prepay_id: string };
    return {
      prepayId: data.prepay_id,
      payParams: this.buildPayParams(data.prepay_id),
      mock: false,
    };
  }

  decryptNotification(
    notification: WechatPaymentNotification,
  ): WechatPaymentResource {
    if (!notification.resource) {
      throw new BadRequestException('Missing payment notification resource');
    }

    const key = Buffer.from(this.apiV3Key, 'utf8');
    const nonce = Buffer.from(notification.resource.nonce, 'utf8');
    const associatedData = Buffer.from(
      notification.resource.associated_data || '',
      'utf8',
    );
    const ciphertext = Buffer.from(notification.resource.ciphertext, 'base64');
    const authTag = ciphertext.subarray(ciphertext.length - 16);
    const data = ciphertext.subarray(0, ciphertext.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', key, nonce);
    decipher.setAAD(associatedData);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);

    return JSON.parse(decrypted.toString('utf8')) as WechatPaymentResource;
  }

  verifyNotificationSignature(input: {
    timestamp?: string | string[];
    nonce?: string | string[];
    signature?: string | string[];
    rawBody?: Buffer;
  }) {
    const publicKey = this.platformPublicKey;
    if (!publicKey) {
      if (this.configService.get<string>('NODE_ENV') === 'production') {
        throw new BadRequestException('Missing Wechat Pay platform public key');
      }
      return true;
    }

    const timestamp = this.singleHeader(input.timestamp);
    const nonce = this.singleHeader(input.nonce);
    const signature = this.singleHeader(input.signature);
    if (!timestamp || !nonce || !signature || !input.rawBody) {
      throw new BadRequestException('Missing Wechat Pay notification signature');
    }

    const message = `${timestamp}\n${nonce}\n${input.rawBody.toString('utf8')}\n`;
    const ok = createVerify('RSA-SHA256')
      .update(message)
      .verify(publicKey, signature, 'base64');

    if (!ok) {
      throw new BadRequestException('Invalid Wechat Pay notification signature');
    }

    return true;
  }

  private buildAuthorization(method: string, path: string, body: string) {
    const nonceStr = this.randomString();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const message = `${method}\n${path}\n${timestamp}\n${nonceStr}\n${body}\n`;
    const signature = this.sign(message);

    return [
      'WECHATPAY2-SHA256-RSA2048',
      `mchid="${this.mchId}"`,
      `nonce_str="${nonceStr}"`,
      `timestamp="${timestamp}"`,
      `serial_no="${this.serialNo}"`,
      `signature="${signature}"`,
    ].join(',');
  }

  private buildPayParams(prepayId: string) {
    const timeStamp = Math.floor(Date.now() / 1000).toString();
    const nonceStr = this.randomString();
    const packageValue = `prepay_id=${prepayId}`;
    const paySign = this.sign(
      `${this.appId}\n${timeStamp}\n${nonceStr}\n${packageValue}\n`,
    );

    return {
      appId: this.appId || 'mock_app_id',
      timeStamp,
      nonceStr,
      package: packageValue,
      signType: 'RSA' as const,
      paySign,
    };
  }

  private sign(message: string) {
    if (!this.privateKey) {
      return 'mock_pay_sign';
    }

    return createSign('RSA-SHA256')
      .update(message)
      .sign(this.privateKey, 'base64');
  }

  private randomString() {
    return randomBytes(16).toString('hex');
  }

  private singleHeader(value?: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
  }

  private isConfigured() {
    return Boolean(
      this.appId &&
        this.mchId &&
        this.serialNo &&
        this.privateKey &&
        this.apiV3Key &&
        this.notifyUrl,
    );
  }

  private get appId() {
    return this.configService.get<string>('WECHAT_APP_ID', '');
  }

  private get mchId() {
    return this.configService.get<string>('WECHAT_MCH_ID', '');
  }

  private get serialNo() {
    return this.configService.get<string>('WECHAT_PAY_SERIAL_NO', '');
  }

  private get privateKey() {
    const key = this.configService.get<string>('WECHAT_PAY_PRIVATE_KEY', '');
    if (key) {
      return key.replace(/\\n/g, '\n');
    }

    const keyPath = this.configService.get<string>(
      'WECHAT_PAY_PRIVATE_KEY_PATH',
      '',
    );
    if (keyPath && existsSync(keyPath)) {
      return readFileSync(keyPath, 'utf8');
    }

    return '';
  }

  private get apiV3Key() {
    return this.configService.get<string>('WECHAT_PAY_API_V3_KEY', '');
  }

  private get notifyUrl() {
    return this.configService.get<string>('WECHAT_PAY_NOTIFY_URL', '');
  }

  private get platformPublicKey() {
    return this.configService
      .get<string>('WECHAT_PAY_PLATFORM_PUBLIC_KEY', '')
      .replace(/\\n/g, '\n');
  }
}
