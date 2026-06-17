import { Body, Controller, Post } from '@nestjs/common';
import { ok } from '../../common/dto/api-response';
import { CalculatePrizeDto } from './dto/calculate-prize.dto';
import { CalculatorService } from './calculator.service';

@Controller('calculator')
export class CalculatorController {
  constructor(private readonly calculatorService: CalculatorService) {}

  @Post('prize')
  async calculate(@Body() dto: CalculatePrizeDto) {
    return ok(await this.calculatorService.calculate(dto));
  }
}
