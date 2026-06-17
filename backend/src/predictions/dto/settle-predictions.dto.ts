import { IsOptional, IsString } from 'class-validator';

export class SettlePredictionsDto {
  @IsOptional()
  @IsString()
  settledByUserId?: string;
}
