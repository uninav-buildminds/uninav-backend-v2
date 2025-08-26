import { CreateAuthDto } from 'src/modules/auth/dto/create-auth.dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { UserRoleEnum } from 'src/utils/types/db.types';
import { IsEnum, IsOptional, IsNotEmpty, IsString } from 'class-validator';
import { IntersectionType } from '@nestjs/mapped-types';

export class CreateStudentDto extends IntersectionType(
  CreateAuthDto,
  CreateUserDto,
) {}
