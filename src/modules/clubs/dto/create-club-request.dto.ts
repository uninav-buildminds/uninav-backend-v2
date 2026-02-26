import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClubRequestDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  interest: string;

  @IsString()
  @IsOptional()
  message?: string;

  // Set programmatically in controller
  requesterId: string;
}
