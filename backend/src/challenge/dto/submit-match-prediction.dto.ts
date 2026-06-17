import { PredictionDirection } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class SubmitMatchPredictionDto {
  @IsString()
  matchId: string;

  @IsEnum(PredictionDirection)
  direction: PredictionDirection;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  predictedHome?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  predictedAway?: number;
}
