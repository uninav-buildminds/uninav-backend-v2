import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ResendVerificationDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
