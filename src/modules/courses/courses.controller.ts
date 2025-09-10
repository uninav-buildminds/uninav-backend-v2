import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ResponseDto } from '@app/common/dto/response.dto';
import { RolesGuard } from '@app/common/guards/roles.guard';
import { CacheControlInterceptor } from '@app/common/interceptors/cache-control.interceptor';
import { CacheControl } from '@app/common/decorators/cache-control.decorator';
import {
  ApprovalStatus,
  UserEntity,
  UserRoleEnum,
} from '@app/common/types/db.types';
import { Request } from 'express';
import { LinkCourseDto } from './dto/link-course.dto';
import { Roles } from '@app/common/decorators/roles.decorator';
import { UpdateCourseDto } from 'src/modules/courses/dto/update-course.dto';
@Controller('courses')
@UseInterceptors(CacheControlInterceptor)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(RolesGuard)
  async create(@Req() req: Request, @Body() createCourseDto: CreateCourseDto) {
    const user = req.user as UserEntity;
    const course = await this.coursesService.create(createCourseDto, user);
    return ResponseDto.createSuccessResponse(
      'Course created successfully',
      course,
    );
  }

  @Post('department-level')
  @UseGuards(RolesGuard)
  async linkCourseToDepartment(
    @Req() req: Request,
    @Body() linkCourseDto: LinkCourseDto,
  ) {
    const user = req.user as UserEntity;
    const result = await this.coursesService.linkCourseToDepartment(
      linkCourseDto,
      user,
    );
    return ResponseDto.createSuccessResponse(
      'Course linked to department successfully',
      result,
    );
  }

  @Get()
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('level') level?: number,
    @Query('query') query?: string,
    // when you specify page, that's when it supports pagination
    @Query('page') page?: number,
    @Query('allowDepartments') allowDepartments?: string,
  ) {
    const courses = await this.coursesService.findAll({
      departmentId,
      page,
      level,
      query,
      allowDepartments: !!allowDepartments,
    });
    return ResponseDto.createSuccessResponse(
      'Courses retrieved successfully',
      courses,
    );
  }

  @Get('code/:courseCode')
  async findByCourseCode(@Param('courseCode') courseCode: string) {
    const course = await this.coursesService.findByCourseCode(courseCode);
    return ResponseDto.createSuccessResponse(
      'Course retrieved successfully',
      course,
    );
  }

  @Get('department-level')
  async findDepartmentLevelCourses(
    @Query('departmentId') departmentId?: string,
    @Query('courseId') courseId?: string,
    @Query('page') page?: number,
  ) {
    const courses = await this.coursesService.findDepartmentLevelCourses({
      departmentId,
      courseId,
      reviewStatus: ApprovalStatus.PENDING,
      page,
    });
    return ResponseDto.createSuccessResponse(
      'Department level courses retrieved successfully',
      courses,
    );
  }

  @Get(':id')
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
  async findById(@Param('id') id: string) {
    const course = await this.coursesService.findById(id);
    return ResponseDto.createSuccessResponse(
      'Course retrieved successfully',
      course,
    );
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Req() req: Request,
  ) {
    const user = req.user as UserEntity;
    const course = await this.coursesService.update(id, updateCourseDto, user);
    return ResponseDto.createSuccessResponse(
      'Course updated successfully',
      course,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async remove(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as UserEntity;
    await this.coursesService.remove(id, user.id);
    return ResponseDto.createSuccessResponse('Course deleted successfully');
  }

  @Delete('department-level/:departmentId/:courseId')
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.ADMIN)
  async removeDepartmentLevelCourse(
    @Param('departmentId') departmentId: string,
    @Param('courseId') courseId: string,
  ) {
    await this.coursesService.deleteDepartmentLevelCourse(
      departmentId,
      courseId,
    );
    return ResponseDto.createSuccessResponse(
      'Department level course removed successfully',
    );
  }
}
