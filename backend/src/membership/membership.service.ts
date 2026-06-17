import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { MembershipStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WechatPayService } from '../wechat-pay/wechat-pay.service';
import { WechatPaymentResource } from '../wechat-pay/wechat-pay.types';
import { CreateMembershipOrderDto } from './dto/create-membership-order.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { MembershipPaymentOrderResponse } from './types/membership-payment.types';

@Injectable()
export class MembershipService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wechatPayService: WechatPayService,
  ) {}

  upsertPlan(dto: CreatePlanDto) {
    return this.prisma.membershipPlan.upsert({
      where: { code: dto.code },
      update: dto,
      create: dto,
    });
  }

  listPlans() {
    return this.prisma.membershipPlan
      .findMany({
        where: { isActive: true },
        orderBy: { priceCents: 'asc' },
      })
      .catch(() => [this.demoPlan()]);
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user
      .findUnique({
        where: { id: userId },
        select: {
          id: true,
          membershipStatus: true,
          membershipExpireAt: true,
        },
      })
      .catch(() => null);

    if (!user) {
      if (userId === 'demo_user') {
        return {
          userId,
          membershipStatus: MembershipStatus.NONE,
          membershipExpireAt: null,
          isMember: false,
          benefits: [],
        };
      }

      throw new NotFoundException('User not found');
    }

    const isMember =
      user.membershipStatus === MembershipStatus.ACTIVE &&
      !!user.membershipExpireAt &&
      user.membershipExpireAt > new Date();

    return {
      userId: user.id,
      membershipStatus: user.membershipStatus,
      membershipExpireAt: user.membershipExpireAt,
      isMember,
      benefits: isMember
        ? ['完整AI报告', '每日精选完整理由', '历史命中率', '挑战赛高级榜单']
        : [],
    };
  }

  async createOrder(
    userId: string,
    dto: CreateMembershipOrderDto,
  ): Promise<MembershipPaymentOrderResponse> {
    const plan = await this.prisma.membershipPlan.findFirst({
      where: { id: dto.planId, isActive: true },
    });

    if (!plan) {
      throw new NotFoundException('Membership plan not found');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { openId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const order = await this.prisma.membershipOrder.create({
      data: {
        userId,
        planId: plan.id,
        amountCents: plan.priceCents,
        orderNo: this.createOrderNo(),
      },
      include: { plan: true },
    });

    const payment = await this.wechatPayService.createJsapiOrder({
      orderNo: order.orderNo,
      description: `${plan.name}会员内容服务`,
      amountCents: order.amountCents,
      payerOpenId: user.openId,
    });

    const updatedOrder = await this.prisma.membershipOrder.update({
      where: { id: order.id },
      data: { wechatPrepayId: payment.prepayId },
    });

    return {
      order: {
        id: updatedOrder.id,
        orderNo: updatedOrder.orderNo,
        amountCents: updatedOrder.amountCents,
        status: updatedOrder.status,
        paidAt: updatedOrder.paidAt,
      },
      payParams: payment.payParams,
      mock: payment.mock,
    };
  }

  async getOrderStatus(userId: string, orderId: string) {
    const order = await this.prisma.membershipOrder.findFirst({
      where: { id: orderId, userId },
      select: {
        id: true,
        orderNo: true,
        amountCents: true,
        status: true,
        paidAt: true,
        createdAt: true,
        plan: {
          select: {
            name: true,
            durationDays: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Membership order not found');
    }

    return order;
  }

  async activateByPaymentNotification(resource: WechatPaymentResource) {
    if (resource.trade_state !== 'SUCCESS') {
      return { status: 'ignored' };
    }

    const order = await this.prisma.membershipOrder.findUnique({
      where: { orderNo: resource.out_trade_no },
      include: { plan: true },
    });

    if (!order) {
      throw new NotFoundException('Membership order not found');
    }

    if (order.status === PaymentStatus.PAID) {
      return { status: 'ok' };
    }

    if (order.amountCents <= 0) {
      throw new BadRequestException('Invalid membership order amount');
    }

    await this.activateMembershipOrder(order.id, {
      paidAt: resource.success_time ? new Date(resource.success_time) : new Date(),
      wechatTransactionId: resource.transaction_id,
    });

    return { status: 'ok' };
  }

  private async activateMembershipOrder(
    orderId: string,
    input: {
      paidAt: Date;
      wechatTransactionId?: string;
    },
  ) {
    const order = await this.prisma.membershipOrder.findUnique({
      where: { id: orderId },
      include: { plan: true },
    });

    if (!order) {
      throw new NotFoundException('Membership order not found');
    }

    const expireAt = new Date(
      input.paidAt.getTime() + order.plan.durationDays * 24 * 60 * 60 * 1000,
    );

    return this.prisma.$transaction(async (tx) => {
      const paidOrder = await tx.membershipOrder.update({
        where: { id: orderId },
        data: {
          status: PaymentStatus.PAID,
          paidAt: input.paidAt,
          wechatTransactionId: input.wechatTransactionId,
        },
        include: { plan: true },
      });

      await tx.user.update({
        where: { id: order.userId },
        data: {
          membershipStatus: MembershipStatus.ACTIVE,
          membershipExpireAt: expireAt,
        },
      });

      return paidOrder;
    });
  }

  private createOrderNo() {
    const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `VIP${Date.now()}${rand}`;
  }

  private demoPlan() {
    return {
      id: 'plan_world_cup_pass_59',
      code: 'WORLD_CUP_PASS_59',
      name: '世界杯通行证',
      priceCents: 5900,
      durationDays: 60,
      benefits: [
        '查看完整AI赛前报告',
        '查看每日精选完整推荐理由',
        '查看历史命中率',
        '查看挑战赛高级榜单',
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
