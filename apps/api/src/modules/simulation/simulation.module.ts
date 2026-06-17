import { Module } from '@nestjs/common';
import { CalculatorModule } from '../calculator/calculator.module';
import { SimulationController } from './simulation.controller';
import { SimulationService } from './simulation.service';

@Module({
  imports: [CalculatorModule],
  controllers: [SimulationController],
  providers: [SimulationService]
})
export class SimulationModule {}
