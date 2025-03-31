import { IsIn, IsNumber, IsString, MinLength } from 'class-validator';
import { UserEntity } from 'src/utils/types/db.types';
export class CreateUserDto
  implements Omit<UserEntity, 'id' | 'createdAt' | 'updatedAt' | 'role'>
{
  @IsString()
  email: string;

  @IsString()
  @MinLength(5)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  username: string;

  @IsString()
  departmentId: string;

  @IsNumber()
  @IsIn([100, 200, 300, 400, 500])
  level: number;
}
