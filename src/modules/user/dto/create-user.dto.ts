import {
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRoleEnum } from 'src/utils/types/db.types';

export class CreateUserDto {
  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@university.edu',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe2023',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: 'Department ID that the user belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
    required: false,
  })
  @IsString()
  @IsOptional()
  departmentId?: string;

  @ApiProperty({
    description: 'Academic level of the user',
    example: 300,
    enum: [100, 200, 300, 400, 500, 600],
  })
  @IsNumber()
  @IsIn([100, 200, 300, 400, 500, 600])
  level: number;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRoleEnum,
    example: UserRoleEnum.STUDENT,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;

  @ApiProperty({
    description: 'Google OAuth ID',
    example: 'google-oauth-id-12345',
    required: false,
  })
  @IsString()
  @IsOptional()
  googleId?: string;
}
