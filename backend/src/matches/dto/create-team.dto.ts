import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MaxLength(8)
  fifaCode: string;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  countryCode?: string;

  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  nameEn?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  groupName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  flagUrl?: string;
}
