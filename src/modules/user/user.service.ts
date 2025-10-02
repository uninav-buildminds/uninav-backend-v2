import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRepository } from './user.repository';
import { DataFormatter } from '../../utils/helpers/data-formater.helper';
import { UsernameGeneratorHelper } from '../../utils/helpers/username-generator.helper';
import { DepartmentService } from '../department/department.service';
import { CoursesRepository } from '../courses/courses.repository';
import { AddBookmarkDto } from './dto/bookmark.dto';
import { PaginationDto } from '../../../libs/common/src/dto/pagination.dto';
import { UserEntity } from '@app/common/types/db.types';
import { StorageService } from '../../utils/storage/storage.service';
import { UpdateProfilePictureDto } from './dto/update-profile-picture.dto';
import { MulterFile } from '@app/common/types';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);
  constructor(
    private readonly userRepository: UserRepository,
    private readonly departmentService: DepartmentService,
    private readonly coursesRepository: CoursesRepository,
    private readonly usernameGenerator: UsernameGeneratorHelper,
    private readonly storageService: StorageService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Check if user already exists by email
    let userWithEmail = await this.userRepository.findByEmail(
      createUserDto.email,
    );
    if (userWithEmail) {
      throw new BadRequestException('User with this email already exists');
    }

    // Generate username if not provided
    if (!createUserDto.username) {
      createUserDto.username = await this.generateUniqueUsernameFromName(
        createUserDto.firstName,
        createUserDto.lastName,
      );
    } else {
      // Check if provided username is already taken
      let userWithUsername = await this.userRepository.findByUsername(
        createUserDto.username,
      );
      if (userWithUsername) {
        throw new BadRequestException('User with this username already exists');
      }
    }

    // Only validate department if departmentId is provided
    if (createUserDto.departmentId) {
      let department = await this.departmentService.findOne(
        createUserDto.departmentId,
      );
      if (!department) {
        throw new NotFoundException(
          `Department with ID ${createUserDto.departmentId} does not exist`,
        );
      }
    }

    try {
      const user = await this.userRepository.create(
        createUserDto as CreateUserDto & { username: string },
      );

      // Only fetch and populate user courses if departmentId and level are provided
      if (createUserDto.departmentId && createUserDto.level) {
        const userCourses =
          await this.coursesRepository.findCoursesByDepartmentAndLevel(
            createUserDto.departmentId,
            createUserDto.level,
          );

        // Create user course relationships
        await this.coursesRepository.createUserCourses(user.id, userCourses);
      }

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

  async findAll(paginationDto: PaginationDto): Promise<{
    data: UserEntity[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page, limit, query } = paginationDto;
      const offset = (page - 1) * limit;
      const users = await this.userRepository.findAllWithRelations(
        limit,
        offset,
        query,
      );
      const totalUsers = await this.userRepository.countAll(query);
      return {
        data: users as any,
        total: totalUsers,
        page,
        limit,
      };
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

  async findByGoogleId(googleId: string) {
    try {
      // userRepository will need findByGoogleId
      const user = await this.userRepository.findByGoogleId(googleId);
      return user; // Can be null if not found, handled by AuthService
    } catch (error) {
      this.logger.error(
        `Error retrieving user by googleId ${googleId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error retrieving user by googleId: ${error.message}`,
      );
    }
  }

  async generateUniqueUsernameFromName(
    firstName?: string,
    lastName?: string,
  ): Promise<string> {
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      let username: string;

      if (firstName || lastName) {
        // Try generating with name-based approach first
        const fullName = `${firstName || ''} ${lastName || ''}`.trim();
        username =
          this.usernameGenerator.generateUsernameWithFallback(fullName);
      } else {
        // Use random generation if no name provided
        username = this.usernameGenerator.generateRandomUsername();
      }

      // Check if username is unique
      const existingUser = await this.userRepository.findByUsername(username);
      if (!existingUser) {
        return username;
      }

      attempts++;
    }

    // If we've tried multiple times and still no unique username, throw error
    this.logger.error(
      `Could not generate a unique username after ${maxAttempts} attempts for ${firstName} ${lastName}`,
    );
    throw new ConflictException('Could not generate a unique username.');
  }

  async generateUniqueUsername(
    firstName: string,
    lastName: string,
  ): Promise<string> {
    return this.generateUniqueUsernameFromName(firstName, lastName);
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
      // Get current user to compare level
      const currentUser = await this.findOne(id);

      // Check department if it's being updated
      let departmentId = currentUser.departmentId;
      if (updateUserDto.departmentId) {
        const department = await this.departmentService.findOne(
          updateUserDto.departmentId,
        );
        if (!department) {
          throw new NotFoundException(
            `Department with ID ${updateUserDto.departmentId} does not exist`,
          );
        }
        departmentId = updateUserDto.departmentId;
      }

      // Check username uniqueness if updating username
      if (updateUserDto.username) {
        const existingUserWithUsername =
          await this.userRepository.findByUsername(updateUserDto.username);
        if (existingUserWithUsername && existingUserWithUsername.id !== id) {
          throw new BadRequestException('Username already in use');
        }
      }

      // Handle course reassignment if level or department is changed
      const levelChanged =
        updateUserDto.level && updateUserDto.level !== currentUser.level;
      const departmentChanged =
        updateUserDto.departmentId &&
        updateUserDto.departmentId !== currentUser.departmentId;

      if (levelChanged || departmentChanged) {
        // Delete all existing user courses
        await this.userRepository.deleteAllUserCourses(id);

        // Use new level or current level, and new department or current department
        const newLevel = updateUserDto.level || currentUser.level;

        // Fetch and assign new courses based on department and level
        const userCourses =
          await this.coursesRepository.findCoursesByDepartmentAndLevel(
            departmentId,
            newLevel,
          );

        // Create new user course relationships
        if (userCourses.length > 0) {
          await this.coursesRepository.createUserCourses(id, userCourses);
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

  async addCourses(userId: string, courseIds: string[]) {
    try {
      await this.findOne(userId); // Verify user exists
      return await this.userRepository.addUserCourses(userId, courseIds);
    } catch (error) {
      this.logger.error(
        `Error adding courses for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error adding courses: ${error.message}`,
      );
    }
  }

  async removeCourses(userId: string, courseIds: string[]) {
    try {
      await this.findOne(userId); // Verify user exists
      return await this.userRepository.removeUserCourses(userId, courseIds);
    } catch (error) {
      this.logger.error(
        `Error removing courses for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error removing courses: ${error.message}`,
      );
    }
  }

  async getUserCourses(userId: string) {
    try {
      return await this.userRepository.getUserCourses(userId);
    } catch (error) {
      this.logger.error(
        `Error getting user courses for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error getting user courses: ${error.message}`,
      );
    }
  }

  async addBookmark(userId: string, addBookmarkDto: AddBookmarkDto) {
    // Validate bookmark data
    if (!addBookmarkDto.materialId && !addBookmarkDto.collectionId) {
      throw new BadRequestException(
        'Either materialId or collectionId must be provided',
      );
    }

    try {
      // Check if bookmark already exists for material
      if (addBookmarkDto.materialId) {
        const existingBookmark =
          await this.userRepository.findBookmarkByMaterial(
            userId,
            addBookmarkDto.materialId,
          );
        if (existingBookmark) {
          throw new ConflictException(
            'Bookmark already exists for this material',
          );
        }
      }

      // Check if bookmark already exists for collection
      if (addBookmarkDto.collectionId) {
        const existingBookmark =
          await this.userRepository.findBookmarkByCollection(
            userId,
            addBookmarkDto.collectionId,
          );
        if (existingBookmark) {
          throw new ConflictException(
            'Bookmark already exists for this collection',
          );
        }
      }

      return this.userRepository.addBookmark(userId, addBookmarkDto);
    } catch (error) {
      this.logger.error(
        `Error adding bookmark for user ${userId}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error adding bookmark: ${error.message}`,
      );
    }
  }

  async removeBookmark(userId: string, bookmarkId: string) {
    try {
      // Check if bookmark exists and belongs to the user
      const bookmark = await this.userRepository.findBookmarkById(bookmarkId);

      if (!bookmark) {
        throw new NotFoundException('Bookmark not found');
      }

      if (bookmark.userId !== userId) {
        throw new BadRequestException(
          'You do not have permission to delete this bookmark',
        );
      }

      return this.userRepository.removeBookmark(bookmarkId);
    } catch (error) {
      this.logger.error(
        `Error removing bookmark for user ${userId}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error removing bookmark: ${error.message}`,
      );
    }
  }

  async getUserBookmarks(userId: string) {
    try {
      return this.userRepository.getUserBookmarks(userId);
    } catch (error) {
      this.logger.error(
        `Error getting bookmarks for user ${userId}: ${error.message}`,
        error.stack,
      );

      throw new InternalServerErrorException(
        `Error getting bookmarks: ${error.message}`,
      );
    }
  }

  async getBookmarkById(userId: string, bookmarkId: string) {
    try {
      // Find the bookmark
      const bookmark = await this.userRepository.findBookmarkById(bookmarkId);

      if (!bookmark) {
        throw new NotFoundException(`Bookmark with ID ${bookmarkId} not found`);
      }

      // Check if the bookmark belongs to the user
      if (bookmark.userId !== userId) {
        throw new BadRequestException(
          'You do not have access to this bookmark',
        );
      }

      return bookmark;
    } catch (error) {
      this.logger.error(
        `Error retrieving bookmark ${bookmarkId} for user ${userId}: ${error.message}`,
        error.stack,
      );

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        `Error retrieving bookmark ${bookmarkId} for user ${userId}: ${error.message}`,
      );
    }
  }

  // Update user profile picture
  async updateProfilePicture(
    userId: string,
    file: MulterFile,
  ): Promise<{ profilePicture: string }> {
    try {
      // Get current user to check existing profile picture
      const currentUser = await this.findOne(userId);

      // Upload new profile picture to storage
      const { publicUrl } = await this.storageService.uploadFile(
        file,
        'public',
        'profile-pictures',
      );

      // Update user record with new profile picture URL
      await this.userRepository.update(userId, { profilePicture: publicUrl });

      // Delete old profile picture if it exists
      if (currentUser.profilePicture) {
        const oldFileKey = this.extractFileKeyFromUrl(
          currentUser.profilePicture,
        );
        if (oldFileKey) {
          await this.storageService.deleteFile(oldFileKey, 'public');
        }
      }

      return { profilePicture: publicUrl };
    } catch (error) {
      this.logger.error(
        `Error updating profile picture for user ${userId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        `Error updating profile picture: ${error.message}`,
      );
    }
  }

  // Helper method to extract file key from URL
  private extractFileKeyFromUrl(url: string): string | null {
    try {
      const urlParts = url.split('/');
      const bucketIndex = urlParts.findIndex((part) => part.includes('uninav'));
      if (bucketIndex !== -1 && bucketIndex + 1 < urlParts.length) {
        return urlParts.slice(bucketIndex + 1).join('/');
      }
      return null;
    } catch (error) {
      this.logger.warn(`Failed to extract file key from URL: ${url}`);
      return null;
    }
  }

  async incrementUploadCount(userId: string) {
    await this.userRepository.incrementUploadCount(userId);
  }

  async incrementDownloadCount(userId: string) {
    await this.userRepository.incrementDownloadCount(userId);
  }
}
