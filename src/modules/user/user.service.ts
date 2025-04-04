import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from 'src/modules/user/user.repository';
import { DataFormatter } from 'src/utils/helpers/data-formater.helper';
import { DepartmentService } from 'src/modules/department/department.service';
import { CoursesRepository } from '../courses/courses.repository';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly departmentService: DepartmentService,
    private readonly coursesRepository: CoursesRepository,
  ) {}

  async createStudent(createUserDto: CreateUserDto) {
    // * email should be verified from auth
    let userWithUsername = await this.userRepository.findByUsername(
      createUserDto.username,
    );
    if (userWithUsername) {
      throw new BadRequestException('User with this username already exists');
    }

    let department = await this.departmentService.findOne(
      createUserDto.departmentId,
    );
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${createUserDto.departmentId} does not exist`,
      );
    }

    try {
      const user = await this.userRepository.create(createUserDto);

      // Fetch and populate user courses
      const userCourses =
        await this.coursesRepository.findCoursesByDepartmentAndLevel(
          createUserDto.departmentId,
          createUserDto.level,
        );

      // Create user course relationships
      await this.coursesRepository.createUserCourses(user.id, userCourses);

      return user;
    } catch (error) {
      this.logger.log(
        `Error creating user with email ${createUserDto.email} and username ${createUserDto.username}`,
        error,
      );
      throw new InternalServerErrorException(
        `Error creating Student Account: ${error.message}`,
      );
    }
  }

  async findAll() {
    try {
      const users = await this.userRepository.findAll();
      return users;
    } catch (error) {
      this.logger.error(
        `Error retrieving users: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error retrieving users: ${error.message}`,
      );
    }
  }

  async findOne(id: string) {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving user ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error retrieving user: ${error.message}`,
      );
    }
  }
  async getProfile(id: string) {
    let user = await this.userRepository.getProfile(id);
    DataFormatter.formatObject(user.auth, ['password']);
    return user;
  }

  async findByEmail(email: string) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new NotFoundException(`User with email ${email} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving user by email: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error retrieving user by email: ${error.message}`,
      );
    }
  }

  async findByUsername(username: string) {
    try {
      const user = await this.userRepository.findByUsername(username);
      if (!user) {
        throw new NotFoundException(`User with username ${username} not found`);
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error retrieving user by username: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error retrieving user by username: ${error.message}`,
      );
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      // Check if user exists
      await this.findOne(id);
      // Check department if it's being updated
      if (updateUserDto.departmentId) {
        const department = await this.departmentService.findOne(
          updateUserDto.departmentId,
        );
        if (!department) {
          throw new NotFoundException(
            `Department with ID ${updateUserDto.departmentId} does not exist`,
          );
        }
      }

      // Check username uniqueness if updating username
      if (updateUserDto.username) {
        const existingUserWithUsername =
          await this.userRepository.findByUsername(updateUserDto.username);
        if (existingUserWithUsername && existingUserWithUsername.id !== id) {
          throw new BadRequestException('Username already in use');
        }
      }

      const updatedUser = await this.userRepository.update(id, updateUserDto);
      return updatedUser;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error updating user ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error updating user: ${error.message}`,
      );
    }
  }

  async remove(id: string) {
    try {
      // Check if user exists
      await this.findOne(id);

      return await this.userRepository.remove(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting user ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error deleting user: ${error.message}`,
      );
    }
  }

  async findByEmailOrUsername(emailOrUsername: string) {
    try {
      const user =
        await this.userRepository.findByEmailOrUsername(emailOrUsername);
      if (!user) {
        throw new NotFoundException(
          `User with email or username ${emailOrUsername} not found`,
        );
      }
      return user;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Error retrieving user by email or username: ${error.message}`,
      );
    }
  }
}
