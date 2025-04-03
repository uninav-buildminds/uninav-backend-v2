import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { ResponseDto } from 'src/utils/globalDto/response.dto';
import { RolesGuard } from 'src/guards/roles.guard';

@Controller('courses')
@UseGuards(RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  async create(@Body() createCourseDto: CreateCourseDto) {
    const course = await this.coursesService.create(createCourseDto);
    return ResponseDto.createSuccessResponse(
      'Course created successfully',
      course,
    );
  }

  @Get()
  async findAll(
    @Query('departmentId') departmentId?: string,
    @Query('level') level?: number,
  ) {
    const courses = await this.coursesService.findAll({
      departmentId,
      level,
    });
    return ResponseDto.createSuccessResponse(
      'Courses retrieved successfully',
      courses,
    );
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    const course = await this.coursesService.findById(id);
    return ResponseDto.createSuccessResponse(
      'Course retrieved successfully',
      course,
    );
  }
}
