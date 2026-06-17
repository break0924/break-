import { IsDateString, IsOptional } from 'class-validator';

export class GenerateDailyRecommendationDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
