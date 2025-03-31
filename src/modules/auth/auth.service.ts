import { Inject, Injectable } from '@nestjs/common';
import { CreateStudentDto } from 'src/modules/auth/dto/create-student.dto';
import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcryptjs';
import envConfig from 'src/utils/config/env.config';
import { ConfigType } from 'src/utils/types/config.types';
import { JwtService } from '@nestjs/jwt';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import { UserEntity } from 'src/utils/types/db.types';
@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT: string;
  constructor(
    private readonly userService: UserService,
    @Inject(envConfig.KEY) private readonly config: ConfigType,
    @Inject(JWT_SYMBOL) private jwtService: JwtService,
  ) {
    this.BCRYPT_SALT = bcrypt.genSaltSync(+this.config.BCRYPT_SALT_ROUNDS);
  }
  async signupStudent(createStudentDto: CreateStudentDto) {
    createStudentDto.password = await this.hashPassword(
      createStudentDto.password,
    );
    return this.userService.createStudent(createStudentDto);
  }
  async hashPassword(password: string) {
    const modifiedPassword = password + this.config.BCRYPT_PEPPER;
    const hashedPassword = await bcrypt.hash(
      modifiedPassword,
      this.BCRYPT_SALT,
    );
    return hashedPassword;
  }
  async comparePassword(password: string, hashedPassword: string) {
    return bcrypt.compare(password + this.config.BCRYPT_PEPPER, hashedPassword);
  }
  async generateToken(userId: string) {
    return await this.jwtService.signAsync({ sub: userId });
  }
  async validateUser(
    emailOrUsername: string,
    password: string,
  ): Promise<UserEntity | null> {
    const user = await this.userService.findByEmailOrUsername(emailOrUsername);
    if (await this.comparePassword(password, user.password)) {
      return user;
    }
    return null;
  }
}
