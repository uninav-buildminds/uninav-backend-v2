import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  Patch,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Request } from 'express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { UserEntity } from 'src/utils/types/db.types';
import { AuthService } from 'src/modules/auth/auth.service';
import { UpdateUserDto } from 'src/modules/user/dto/update-user.dto';
import { AddCourseDto } from './dto/add-course.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userService.createStudent(createUserDto);
    return ResponseDto.createSuccessResponse('User created successfully', user);
  }

  @Get('profile')
  @UseGuards(RolesGuard)
  async getProfile(@Req() req: Request) {
    const user = req.user as UserEntity;
    let profile = await this.userService.getProfile(user.id);
    return ResponseDto.createSuccessResponse(
      'User profile retrieved successfully',
      profile,
    );
  }

  @Patch()
  @UseGuards(RolesGuard)
  async update(@Req() req: Request, @Body() updateUserDto: UpdateUserDto) {
    const user = req.user as UserEntity;
    const updatedUser = await this.userService.update(user.id, updateUserDto);
    return ResponseDto.createSuccessResponse(
      'User updated successfully',
      updatedUser,
    );
  }

  @Post('courses')
  @UseGuards(RolesGuard)
  async addCourses(@Req() req: Request, @Body() addCourseDto: AddCourseDto) {
    const user = req.user as UserEntity;
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
  async removeCourses(@Req() req: Request, @Body() addCourseDto: AddCourseDto) {
    const user = req.user as UserEntity;
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
  async getUserCourses(@Req() req: Request) {
    const user = req.user as UserEntity;
    console.log('user', user);
    const courses = await this.userService.getUserCourses(user.id);
    return ResponseDto.createSuccessResponse(
      'User courses retrieved successfully',
      courses,
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
}
