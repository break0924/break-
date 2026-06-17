import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SubmitTournamentPickDto {
  @IsString()
  seasonId: string;

  @IsOptional()
  @IsString()
  championTeamId?: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  finalFourTeamIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  goldenBootName?: string;
}
