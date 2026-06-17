import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CorrectMatchResultDto {
  @IsInt()
  @Min(0)
  @Max(99)
  homeScore!: number;

  @IsInt()
  @Min(0)
  @Max(99)
  awayScore!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
