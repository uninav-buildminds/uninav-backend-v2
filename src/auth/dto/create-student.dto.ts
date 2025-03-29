import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserRoleEnum } from 'src/utils/types/db.types';

export class CreateStudentDto extends CreateUserDto {
  role: UserRoleEnum.STUDENT;
}
