import { Type } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAiReportDto {
  @IsString()
  @MaxLength(500)
  summary: string;

  @IsString()
  fullContent: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  homeWinProb: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  drawProb: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  awayWinProb: number;

  @IsInt()
  @Min(0)
  predictedHome: number;

  @IsInt()
  @Min(0)
  predictedAway: number;

  @IsInt()
  @Min(1)
  @Max(100)
  riskIndex: number;

  @IsInt()
  @Min(1)
  @Max(100)
  confidenceIndex: number;

  @IsString()
  @MaxLength(40)
  promptVersion: string;

  @IsString()
  @MaxLength(80)
  model: string;
}
