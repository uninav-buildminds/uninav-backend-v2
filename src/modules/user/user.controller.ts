import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Headers,
  UnauthorizedException,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { UserService } from './user.service';
import { ResponseDto } from '../../../libs/common/src/dto/response.dto';
import { RolesGuard } from '../../../libs/common/src/guards/roles.guard';
import { UserEntity } from '../../../libs/common/src/types/db.types';
import { CurrentUser } from '../../../libs/common/src/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddCourseDto } from './dto/add-course.dto';
import { AddBookmarkDto } from './dto/bookmark.dto';
import { CacheControl } from '@app/common/decorators/cache-control.decorator';
import { ConfigService } from '@nestjs/config';
import { Roles } from '../../../libs/common/src/decorators/roles.decorator';
import { UserRoleEnum } from '../../../libs/common/src/types/db.types';
import { PaginationDto } from '../../../libs/common/src/dto/pagination.dto';
import { UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterFile } from '@app/common/types';

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {}

  @Get('profile')
  @UseGuards(RolesGuard)
  async getProfile(@CurrentUser() user: UserEntity) {
    let profile = await this.userService.getProfile(user.id);
    return ResponseDto.createSuccessResponse(
      'User profile retrieved successfully',
      profile,
    );
  }

  @Get('user-profile')
  async getProfileCourses(@Query('username') username: string) {
    const { email, ...user } = await this.userService.findByUsername(username);
    return ResponseDto.createSuccessResponse(
      'User courses retrieved successfully',
      user,
    );
  }

  @Patch()
  @UseGuards(RolesGuard)
  async update(
    @CurrentUser() user: UserEntity,
    @Body() updateUserDto: UpdateUserDto,
    @Headers('root-api-key') rootApiKey?: string,
  ) {
    // Check if role update is requested and validate API key
    if (updateUserDto.role) {
      if (rootApiKey !== this.configService.get('ROOT_API_KEY')) {
        throw new UnauthorizedException('Invalid or missing root API key');
      }
    }

    const updatedUser = await this.userService.update(user.id, updateUserDto);
    return ResponseDto.createSuccessResponse(
      'User updated successfully',
      updatedUser,
    );
  }

  @Post('courses')
  @UseGuards(RolesGuard)
  async addCourses(
    @CurrentUser() user: UserEntity,
    @Body() addCourseDto: AddCourseDto,
  ) {
    const result = await this.userService.addCourses(
      user.id,
      addCourseDto.courseIds,
    );
    return ResponseDto.createSuccessResponse(
      'Courses added successfully',
      result,
    );
  }

  @Delete('courses')
  @UseGuards(RolesGuard)
  async removeCourses(
    @CurrentUser() user: UserEntity,
    @Body() addCourseDto: AddCourseDto,
  ) {
    const result = await this.userService.removeCourses(
      user.id,
      addCourseDto.courseIds,
    );
    return ResponseDto.createSuccessResponse(
      'Courses removed successfully',
      result,
    );
  }

  @Get('courses')
  @UseGuards(RolesGuard)
  async getUserCourses(@CurrentUser() user: UserEntity) {
    console.log('user', user);
    const courses = await this.userService.getUserCourses(user.id);
    return ResponseDto.createSuccessResponse(
      'User courses retrieved successfully',
      courses,
    );
  }

  @Post('bookmarks')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  async addBookmark(
    @CurrentUser() user: UserEntity,
    @Body() addBookmarkDto: AddBookmarkDto,
  ) {
    const bookmark = await this.userService.addBookmark(
      user.id,
      addBookmarkDto,
    );
    return ResponseDto.createSuccessResponse(
      'Bookmark added successfully',
      bookmark,
    );
  }

  @Delete('bookmarks/:bookmarkId')
  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.OK)
  async removeBookmark(
    @CurrentUser() user: UserEntity,
    @Param('bookmarkId', ParseUUIDPipe) bookmarkId: string,
  ) {
    const bookmark = await this.userService.removeBookmark(user.id, bookmarkId);
    return ResponseDto.createSuccessResponse(
      'Bookmark removed successfully',
      bookmark,
    );
  }

  @Get('bookmarks/:bookmarkId')
  @UseGuards(RolesGuard)
  @CacheControl({ maxAge: 300, private: true }) // Cache for 5 minutes
  async getBookmark(
    @CurrentUser() user: UserEntity,
    @Param('bookmarkId', ParseUUIDPipe) bookmarkId: string,
  ) {
    const bookmark = await this.userService.getBookmarkById(
      user.id,
      bookmarkId,
    );
    return ResponseDto.createSuccessResponse(
      'Bookmark retrieved successfully',
      bookmark,
    );
  }

  @Get('bookmarks')
  @UseGuards(RolesGuard)
  @CacheControl({ maxAge: 300, private: true }) // Cache for 5 minutes
  async getUserBookmarks(
    @CurrentUser() user: UserEntity,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeMaterial') includeMaterial?: string,
  ) {
    // Support pagination when query params are provided
    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, Number.parseInt(page || '1', 10) || 1);
      const limitNum = Math.min(
        50,
        Math.max(1, Number.parseInt(limit || '10', 10) || 10),
      );
      const include = includeMaterial !== 'false';

      const result = await this.userService.getUserBookmarksPaginated(
        user.id,
        pageNum,
        limitNum,
        include,
      );

      return ResponseDto.createSuccessResponse(
        'Bookmarks retrieved successfully',
        result,
      );
    }

    // Support lightweight bookmarks when includeMaterial=false
    if (includeMaterial === 'false') {
      const bookmarks = await this.userService.getUserBookmarksLite(user.id);
      return ResponseDto.createSuccessResponse(
        'Bookmarks retrieved successfully',
        bookmarks,
      );
    }

    // Legacy: return full list (with material) when pagination params are absent
    const bookmarks = await this.userService.getUserBookmarks(user.id);
    return ResponseDto.createSuccessResponse(
      'Bookmarks retrieved successfully',
      bookmarks,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userService.findOne(id);
    return ResponseDto.createSuccessResponse(
      'User retrieved successfully',
      user,
    );
  }

  @Get()
  @UseGuards(RolesGuard)
  async findAll(@Query() paginationDto: PaginationDto) {
    const result = await this.userService.findAll(paginationDto);
    return ResponseDto.createSuccessResponse(
      'Users retrieved successfully',
      result,
    );
  }

  @Post('profile-picture')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('profilePicture'))
  @HttpCode(HttpStatus.OK)
  async updateProfilePicture(
    @CurrentUser() user: UserEntity,
    @UploadedFile() file: MulterFile,
  ) {
    if (!file) {
      throw new BadRequestException('Profile picture file is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and GIF images are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 5MB');
    }

    const result = await this.userService.updateProfilePicture(user.id, file);
    return ResponseDto.createSuccessResponse(
      'Profile picture updated successfully',
      result,
    );
  }
}
