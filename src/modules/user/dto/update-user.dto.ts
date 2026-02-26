import { CreateUserDto } from './create-user.dto';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsIn,
} from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email']),
) {
  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsNumber()
  @IsIn([100, 200, 300, 400, 500, 600, 700])
  @IsOptional()
  level?: number;

  @IsString()
  @IsOptional()
  googleId?: string;

  @IsString()
  @IsOptional()
  profilePicture?: string;
}
