import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class PublishPredictionsDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ids?: string[];
}
