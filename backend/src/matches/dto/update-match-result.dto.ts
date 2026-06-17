import { MatchStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, Min } from 'class-validator';

export class UpdateMatchResultDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeScore: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayScore: number;

  @IsEnum(MatchStatus)
  status: MatchStatus;
}
