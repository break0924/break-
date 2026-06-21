import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminRoleGuard } from '../auth/guards/admin-role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobsService } from './jobs.service';

@Controller('admin/jobs')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('daily-refresh')
  dailyRefresh() {
    return this.jobsService.runDailyRefresh('ADMIN_MANUAL');
  }

  @Get('status')
  status() {
    return this.jobsService.getStatus();
  }
}
