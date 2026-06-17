import { Body, Controller, Post } from '@nestjs/common';
import { ok } from '../../common/dto/api-response';
import { CreateSimulationPlanDto } from './dto/create-simulation-plan.dto';
import { SimulationService } from './simulation.service';

@Controller('simulation')
export class SimulationController {
  constructor(private readonly simulationService: SimulationService) {}

  @Post('plans')
  async create(@Body() dto: CreateSimulationPlanDto) {
    return ok(await this.simulationService.create(dto));
  }
}
