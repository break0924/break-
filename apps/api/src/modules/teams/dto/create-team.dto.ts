import { IsOptional, IsString } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  nameEn?: string;

  @IsString()
  @IsOptional()
  fifaCode?: string;

  @IsString()
  @IsOptional()
  groupName?: string;

  @IsString()
  @IsOptional()
  flagUrl?: string;
}
