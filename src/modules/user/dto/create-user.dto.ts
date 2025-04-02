import { IsEmail, IsIn, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @IsNumber()
  @IsIn([100, 200, 300, 400, 500])
  level: number;
}
