import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  emailOrMatricNo: string; // Can be either email or matriculation number

  @IsString()
  @IsNotEmpty()
  password: string;
}
