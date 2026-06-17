import { IsBoolean, IsDateString, IsIn, IsOptional } from 'class-validator';

export class RunResultSyncDto {
  @IsOptional()
  @IsIn(['CURRENT_AND_TODAY', 'YESTERDAY', 'DATE'])
  mode?: 'CURRENT_AND_TODAY' | 'YESTERDAY' | 'DATE';

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  forceSettlement?: boolean;
}
