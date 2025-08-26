import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRoleEnum } from 'src/utils/types/db.types';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  departmentId: string;

  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @IsNumber()
  @IsIn([100, 200, 300, 400, 500, 600, 700])
  level: number;

  username?: string; // generated from start

  googleId?: string;
}
