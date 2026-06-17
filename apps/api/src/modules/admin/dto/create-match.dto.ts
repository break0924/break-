import { MatchStage, MatchStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateMatchDto {
  @IsString()
  matchNo!: string;

  @IsEnum(MatchStage)
  stage!: MatchStage;

  @IsString()
  @IsOptional()
  groupName?: string;

  @IsDateString()
  kickoffAt!: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsString()
  homeTeamId!: string;

  @IsString()
  awayTeamId!: string;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;
}

export class UpdateMatchResultDto {
  @IsInt()
  @Min(0)
  homeScore!: number;

  @IsInt()
  @Min(0)
  awayScore!: number;

  @IsString()
  @IsOptional()
  resultNote?: string;
}
