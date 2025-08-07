import { CreateAuthDto } from 'src/modules/auth/dto/create-auth.dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UserRoleEnum } from 'src/utils/types/db.types';
import { IntersectionType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStudentDto extends IntersectionType(
  CreateAuthDto,
  CreateUserDto,
) {
  @ApiProperty({
    description: 'User role in the system',
    enum: UserRoleEnum,
    example: UserRoleEnum.STUDENT,
    required: false,
    default: UserRoleEnum.STUDENT,
  })
  @IsOptional()
  @IsEnum(UserRoleEnum)
  role?: UserRoleEnum;
}
