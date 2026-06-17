import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get()
  root() {
    return {
      status: 'ok',
      service: 'ai-world-cup-predictor-backend',
      message: 'AI世界杯预测官后端 API 已启动',
      endpoints: {
        health: '/api/health',
        matches: '/api/matches',
        todayPredictions: '/api/predictions/today',
        resultSyncDashboard: '/api/admin/result-sync/dashboard',
      },
      compliance:
        '仅限足球数据分析、AI预测、挑战赛积分和会员内容解锁',
    };
  }

  @Get('health')
  check() {
    return {
      status: 'ok',
      service: 'ai-world-cup-predictor-backend',
      compliance:
        '仅限足球数据分析、AI预测、挑战赛积分和会员内容解锁',
    };
  }
}
