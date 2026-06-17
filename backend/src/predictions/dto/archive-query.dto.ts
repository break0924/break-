import { IsDateString, IsIn, IsOptional } from 'class-validator';

export class ArchiveQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsIn(['hit', 'miss', 'pending'])
  hit?: 'hit' | 'miss' | 'pending';
}
