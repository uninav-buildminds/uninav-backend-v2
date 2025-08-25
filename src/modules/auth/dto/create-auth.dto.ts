import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserIdTypeEnum } from 'src/utils/types/db.types';

export class CreateAuthDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@university.edu',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Student matriculation number',
    example: '223221',
    minLength: 6,
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6)
  @IsOptional()
  matricNo?: string;

  @ApiProperty({
    description: 'Type of student identification document',
    enum: UserIdTypeEnum,
    example: UserIdTypeEnum.ID_CARD,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserIdTypeEnum, {
    message: 'Student ID type must be either "id card" or "admission letter"',
  })
  userIdType?: UserIdTypeEnum;

  @ApiProperty({
    description: 'URL or path to student ID image',
    example: 'https://storage.example.com/id-images/student123.jpg',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  userIdImage?: string;
}
