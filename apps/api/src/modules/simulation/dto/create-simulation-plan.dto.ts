import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDecimal,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested
} from 'class-validator';
import { CalculatePrizeDto, PrizeSelectionDto } from '../../calculator/dto/calculate-prize.dto';

const POSITIVE_MONEY_PATTERN = /^(?!0+(\.0+)?$)\d+(\.\d{1,2})?$/;

export class SimulationSelectionDto extends PrizeSelectionDto {
  @IsString()
  declare matchId: string;
}

export class CreateSimulationPlanDto extends CalculatePrizeDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  riskNoticeAccepted = false;

  @ValidateNested({ each: true })
  @Type(() => SimulationSelectionDto)
  declare selections: SimulationSelectionDto[];

  @IsDecimal()
  @Matches(POSITIVE_MONEY_PATTERN)
  declare stake: string;

  @IsInt()
  @Min(1)
  multiple = 1;
}
