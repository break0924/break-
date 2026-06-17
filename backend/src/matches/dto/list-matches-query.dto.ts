import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { MatchStatus, TournamentStage } from '@prisma/client';

export class ListMatchesQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-L]$/)
  groupName?: string;

  @IsOptional()
  @IsEnum(TournamentStage)
  stage?: TournamentStage;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;
}
