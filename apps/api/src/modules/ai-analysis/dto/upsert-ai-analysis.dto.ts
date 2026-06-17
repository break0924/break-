import { RiskLevel } from '@prisma/client';
import { IsDecimal, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpsertAiAnalysisDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  summary!: string;

  @IsString()
  @IsOptional()
  tacticalNotes?: string;

  @IsString()
  @IsOptional()
  injuryNotes?: string;

  @IsEnum(RiskLevel)
  @IsOptional()
  riskLevel?: RiskLevel;

  @IsDecimal()
  @IsOptional()
  confidence?: string;
}
