import { Inject, Injectable } from '@nestjs/common';
import { CreateStudentDto } from 'src/auth/dto/create-student.dto';
import { UserService } from 'src/user/user.service';
import * as bcrypt from 'bcryptjs';
import setupConfig from 'src/utils/config/setup.config';
import { ConfigType } from 'src/utils/types/config.types';
@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT: string;
  constructor(
    private readonly userService: UserService,
    @Inject(setupConfig.KEY) private readonly config: ConfigType,
  ) {
    this.BCRYPT_SALT = bcrypt.genSaltSync(+this.config.BCRYPT_SALT_ROUNDS);
  }
  async signupStudent(createStudentDto: CreateStudentDto) {
    createStudentDto.password = await this.hashPassword(
      createStudentDto.password,
    );
    return this.userService.createStudent(createStudentDto);
  }
  hashPassword(password: string) {
    const modifiedPassword = password + this.config.BCRYPT_PEPPER;
    const hashedPassword = bcrypt.hash(modifiedPassword, this.BCRYPT_SALT);
    return hashedPassword;
  }
  async comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password + this.config.BCRYPT_PEPPER, hashedPassword);
  }
}
