import { IsString } from 'class-validator';

export class CreateMembershipOrderDto {
  @IsString()
  planId: string;
}
