import { Module } from '@nestjs/common';
import { MatchMonitorService } from './match-monitor.service';

@Module({
  providers: [MatchMonitorService],
  exports: [MatchMonitorService],
})
export class MatchMonitorModule {}
