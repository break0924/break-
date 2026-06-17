import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @MaxLength(40)
  code: string;

  @IsString()
  @MaxLength(80)
  name: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  priceCents: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationDays: number;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  benefits: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
