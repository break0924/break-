import { TournamentStage } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  externalId?: string;

  @IsEnum(TournamentStage)
  stage: TournamentStage;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  groupName?: string;

  @IsString()
  homeTeamId: string;

  @IsString()
  awayTeamId: string;

  @IsDateString()
  kickoffAt: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  venue?: string;
}
