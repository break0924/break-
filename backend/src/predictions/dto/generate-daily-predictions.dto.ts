import { IsBoolean, IsDateString, IsOptional } from 'class-validator';

export class GenerateDailyPredictionsDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  isMemberContent?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsBoolean()
  publish?: boolean;
}
