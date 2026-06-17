import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class RecordMatchResultDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  homeScore: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  awayScore: number;
}
