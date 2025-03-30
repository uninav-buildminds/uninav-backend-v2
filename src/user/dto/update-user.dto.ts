import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto implements Partial<CreateUserDto> {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(5)
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsNumber()
  @IsIn([100, 200, 300, 400, 500])
  @IsOptional()
  level?: number;
}
