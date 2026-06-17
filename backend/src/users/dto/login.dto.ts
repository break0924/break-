import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(128)
  openId: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  unionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
