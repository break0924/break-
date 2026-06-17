import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SetTournamentResultDto {
  @IsOptional()
  @IsString()
  actualChampionTeamId?: string;

  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  actualFinalFourTeamIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  actualGoldenBootName?: string;
}
