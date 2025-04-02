import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreateStudentDto } from 'src/modules/auth/dto/create-student.dto';
import { UserService } from 'src/modules/user/user.service';
import * as bcrypt from 'bcryptjs';
import envConfig from 'src/utils/config/env.config';
import { ConfigType } from 'src/utils/types/config.types';
import { JwtService } from '@nestjs/jwt';
import { JWT_SYMBOL } from 'src/utils/config/constants.config';
import { UserEntity } from 'src/utils/types/db.types';
import { AuthRepository } from './auth.repository';
import { DataFormatter } from 'src/utils/helpers/data-formater.helper';

@Injectable()
export class AuthService {
  private readonly BCRYPT_SALT: string;
  constructor(
    private readonly userService: UserService,
    private readonly authRepository: AuthRepository,
    @Inject(envConfig.KEY) private readonly config: ConfigType,
    @Inject(JWT_SYMBOL) private jwtService: JwtService,
  ) {
    this.BCRYPT_SALT = bcrypt.genSaltSync(+this.config.BCRYPT_SALT_ROUNDS);
  }
  async findOne(id: string, exclude: boolean = false) {
    const auth = await this.authRepository.findByUserId(id);
    if (!auth) {
      throw new BadRequestException('auth for User not found');
    }
    return exclude ? DataFormatter.formatObject(auth, ['password']) : auth;
  }

  async signupStudent(createStudentDto: CreateStudentDto) {
    if (createStudentDto.matricNo) {
      if (await this.authRepository.findByMatricNo(createStudentDto.matricNo)) {
        throw new BadRequestException(
          'User with this matriculation number already exists',
        );
      }
    }

    // Create user first
    const userDto = {
      email: createStudentDto.email,
      firstName: createStudentDto.firstName,
      lastName: createStudentDto.lastName,
      username: createStudentDto.username,
      departmentId: createStudentDto.departmentId,
      level: createStudentDto.level,
    };

    const createdUser = await this.userService.createStudent(userDto);

    // Then create auth record with hashed password
    const hashedPassword = await this.hashPassword(createStudentDto.password);
    const authDto = {
      email: createStudentDto.email,
      password: hashedPassword,
      matricNo: createStudentDto.matricNo,
      studentIdType: createStudentDto.userIdType,
      studentIdImage: createStudentDto.userIdImage,
      userId: createdUser.id,
    };

    await this.authRepository.create(authDto);

    return createdUser;
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
    emailOrMatricNo: string,
    password: string,
  ): Promise<UserEntity | null> {
    const authData =
      await this.authRepository.findByEmailOrMatricNo(emailOrMatricNo);

    if (!authData) {
      return null;
    }

    if (await this.comparePassword(password, authData.password)) {
      // Return the user data without sensitive auth information
      return authData.user;
    }
    return null;
  }
}
