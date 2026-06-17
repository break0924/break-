import { Injectable } from '@nestjs/common';
import { SimulationMode } from '@prisma/client';
import Decimal from 'decimal.js';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CalculatePrizeDto } from './dto/calculate-prize.dto';

const RISK_NOTICE =
  '理论奖金按输入赔率测算，仅供模拟参考，不构成购买建议，实际规则和结果以官方渠道为准。';

@Injectable()
export class CalculatorService {
  constructor(private readonly prisma: PrismaService) {}

  async calculate(dto: CalculatePrizeDto, visitorKey?: string) {
    const estimatedPrize =
      dto.mode === SimulationMode.PARLAY
        ? this.calculateParlay(dto)
        : this.calculateSingle(dto);

    const result = {
      estimatedPrizeMin: estimatedPrize.toFixed(2),
      estimatedPrizeMax: estimatedPrize.toFixed(2),
      details: [
        {
          formula: this.buildFormula(dto),
          estimatedPrize: estimatedPrize.toFixed(2)
        }
      ],
      riskNotice: RISK_NOTICE
    };

    await this.prisma.prizeCalculation.create({
      data: {
        visitorKey,
        mode: dto.mode,
        stake: dto.stake,
        multiple: dto.multiple,
        estimatedPrizeMin: result.estimatedPrizeMin,
        estimatedPrizeMax: result.estimatedPrizeMax,
        formula: result.details[0].formula,
        selections: {
          create: dto.selections.map((selection) => ({
            matchId: selection.matchId,
            market: selection.market,
            selection: selection.selection,
            odds: selection.odds
          }))
        }
      }
    });

    return result;
  }

  private calculateSingle(dto: CalculatePrizeDto) {
    return dto.selections.reduce((sum, selection) => {
      return sum.plus(new Decimal(dto.stake).mul(selection.odds).mul(dto.multiple));
    }, new Decimal(0));
  }

  private calculateParlay(dto: CalculatePrizeDto) {
    const combinedOdds = dto.selections.reduce((product, selection) => {
      return product.mul(selection.odds);
    }, new Decimal(1));

    return new Decimal(dto.stake).mul(combinedOdds).mul(dto.multiple);
  }

  private buildFormula(dto: CalculatePrizeDto) {
    const oddsPart = dto.selections.map((item) => item.odds).join(' * ');
    return `${dto.stake} * ${oddsPart} * ${dto.multiple}`;
  }
}
