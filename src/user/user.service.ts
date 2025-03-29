import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from 'src/user/user.repository';
import { AuthService } from 'src/auth/auth.service';
import { DataFormatter } from 'src/utils/helpers/data-formater.helper';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    // private readonly authService: AuthService,
  ) {}
  async createStudent(createUserDto: CreateUserDto) {
    let userWithEmail = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (userWithEmail) {
      throw new BadRequestException('User with this email already exists');
    }
    let userWithUsername = await this.userRepository.findByUsername(
      createUserDto.username,
    );
    if (userWithUsername) {
      throw new BadRequestException('User with this username already exists');
    }

    try {
      const user = await this.userRepository.create(createUserDto);
      DataFormatter.formatObject(user, ['password']);
      return user as Omit<typeof user, 'password'>;
    } catch (error) {
      this.logger.log(
        `Error creating user with email ${createUserDto.email} and username ${createUserDto.username}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error Student Account : ${error.message}`,
      );
    }
  }

  findAll() {
    return `This action returns all users`;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
