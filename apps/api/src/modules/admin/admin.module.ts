import { Module } from '@nestjs/common';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { AdminMatchesController } from './admin-matches.controller';
import { AdminMatchesService } from './admin-matches.service';

@Module({
  imports: [AuditLogModule],
  controllers: [AdminMatchesController],
  providers: [AdminMatchesService]
})
export class AdminModule {}
