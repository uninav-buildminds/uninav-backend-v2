import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';
import { CacheControlInterceptor } from 'src/interceptors/cache-control.interceptor';
import { CacheControl } from 'src/utils/decorators/cache-control.decorator';
import { ApprovalStatus, UserEntity } from 'src/utils/types/db.types';
import { Request } from 'express';

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

  @Get()
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('level') level?: number,
    @Query('allowDuplicates') allowDuplicates?: string,
  ) {
    const courses = await this.coursesService.findAll({
      departmentId,
      level,
      allowDuplicates: !!allowDuplicates,
    });
    return ResponseDto.createSuccessResponse(
      'Courses retrieved successfully',
      courses,
    );
  }

  @Get('code/:courseCode')
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
  async findByCourseCode(@Param('courseCode') courseCode: string) {
    const course = await this.coursesService.findByCourseCode(courseCode);
    return ResponseDto.createSuccessResponse(
      'Course retrieved successfully',
      course,
    );
  }

  @Get('department-level')
  @CacheControl({ public: true, maxAge: 3600 * 24 }) // Cache for 1 day
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
}
