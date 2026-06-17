import { OddsMarket, SelectionType } from '@prisma/client';
import { IsDecimal, IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class CreateOddsDto {
  @IsEnum(OddsMarket)
  market!: OddsMarket;

  @IsEnum(SelectionType)
  selection!: SelectionType;

  @IsDecimal()
  @Matches(/^[1-9]\d*(\.\d{1,4})?$/)
  odds!: string;

  @IsString()
  @IsOptional()
  source?: string;
}
