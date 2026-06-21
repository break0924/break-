import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateChatMessageDto {
  @IsString()
  @MaxLength(100)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
