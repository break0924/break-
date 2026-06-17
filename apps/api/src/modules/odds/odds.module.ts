import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OddsController } from './odds.controller';
import { OddsService } from './odds.service';

@Module({
  imports: [AuditLogModule],
  controllers: [OddsController],
  providers: [OddsService],
  exports: [OddsService]
})
export class OddsModule {}
