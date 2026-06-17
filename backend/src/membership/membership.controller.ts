import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtUser } from '../auth/auth.types';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateMembershipOrderDto } from './dto/create-membership-order.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { MembershipService } from './membership.service';

@Controller('membership')
export class MembershipController {
  constructor(private readonly membershipService: MembershipService) {}

  @Post('plans')
  @UseGuards(JwtAuthGuard, AdminRoleGuard)
  upsertPlan(@Body() dto: CreatePlanDto) {
    return this.membershipService.upsertPlan(dto);
  }

  @Get('plans')
  listPlans() {
    return this.membershipService.listPlans();
  }

  @Get('status')
  @UseGuards(JwtAuthGuard)
  status(@CurrentUser() user: JwtUser) {
    return this.membershipService.getStatus(user.id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  createOrder(
    @CurrentUser() user: JwtUser,
    @Body() dto: CreateMembershipOrderDto,
  ) {
    return this.membershipService.createOrder(user.id, dto);
  }

  @Get('orders/:id/status')
  @UseGuards(JwtAuthGuard)
  orderStatus(@CurrentUser() user: JwtUser, @Param('id') id: string) {
    return this.membershipService.getOrderStatus(user.id, id);
  }
}
