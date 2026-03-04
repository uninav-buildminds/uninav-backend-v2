import { CreateUserDto } from './create-user.dto';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsIn,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { CLUB_INTERESTS } from 'src/utils/config/interests.constants';

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

  @IsArray()
  @IsString({ each: true })
  @IsIn([...CLUB_INTERESTS], { each: true })
  @ArrayMaxSize(10)
  @IsOptional()
  interests?: string[];
}
