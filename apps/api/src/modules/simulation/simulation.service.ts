import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CalculatorService } from '../calculator/calculator.service';
import { CreateSimulationPlanDto } from './dto/create-simulation-plan.dto';

@Injectable()
export class SimulationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly calculatorService: CalculatorService
  ) {}

  async create(dto: CreateSimulationPlanDto) {
    const calculation = await this.calculatorService.calculate(dto);

    const plan = await this.prisma.simulationPlan.create({
      data: {
        name: dto.name,
        mode: dto.mode,
        stake: dto.stake,
        multiple: dto.multiple,
        estimatedPrizeMin: calculation.estimatedPrizeMin,
        estimatedPrizeMax: calculation.estimatedPrizeMax,
        riskNoticeAccepted: dto.riskNoticeAccepted,
        items: {
          create: dto.selections.map((item) => ({
            matchId: item.matchId,
            market: item.market,
            selection: item.selection,
            odds: item.odds
          }))
        }
      },
      include: { items: true }
    });

    return {
      ...plan,
      riskNotice: calculation.riskNotice
    };
  }
}
