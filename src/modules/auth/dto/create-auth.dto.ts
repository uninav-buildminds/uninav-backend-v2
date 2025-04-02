import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { UserIdTypeEnum } from 'src/utils/types/db.types';

export class CreateAuthDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @Length(6)
  matricNo?: string;

  @IsOptional()
  @IsEnum(UserIdTypeEnum, {
    message: 'Student ID type must be either "id card" or "admission letter"',
  })
  userIdType?: UserIdTypeEnum;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userIdImage?: string;
}
