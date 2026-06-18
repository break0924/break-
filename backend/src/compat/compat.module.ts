import { Module } from '@nestjs/common';
import { ChallengeModule } from '../challenge/challenge.module';
import { CompatController } from './compat.controller';

@Module({
  imports: [ChallengeModule],
  controllers: [CompatController],
})
export class CompatModule {}
