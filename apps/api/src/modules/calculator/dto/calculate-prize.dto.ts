import { OddsMarket, SelectionType, SimulationMode } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested
} from 'class-validator';

const POSITIVE_MONEY_PATTERN = /^(?!0+(\.0+)?$)\d+(\.\d{1,2})?$/;
const ODDS_PATTERN = /^[1-9]\d*(\.\d{1,4})?$/;

export class PrizeSelectionDto {
  @IsString()
  @IsOptional()
  matchId?: string;

  @IsEnum(OddsMarket)
  market!: OddsMarket;

  @IsEnum(SelectionType)
  selection!: SelectionType;

  @IsDecimal()
  @Matches(ODDS_PATTERN)
  odds!: string;
}

export class CalculatePrizeDto {
  @IsDecimal()
  @Matches(POSITIVE_MONEY_PATTERN)
  stake!: string;

  @IsInt()
  @Min(1)
  multiple = 1;

  @IsEnum(SimulationMode)
  mode: SimulationMode = SimulationMode.SINGLE;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PrizeSelectionDto)
  selections!: PrizeSelectionDto[];
}
