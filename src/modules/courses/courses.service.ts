import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesRepository } from './courses.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { DepartmentService } from '../department/department.service';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly departmentService: DepartmentService,
  ) {}

  async create(createCourseDto: CreateCourseDto) {
    // Verify department exists
    const department = await this.departmentService.findOne(
      createCourseDto.departmentId,
    );
    if (!department) {
      throw new BadRequestException(
        `Department with ID ${createCourseDto.departmentId} not found`,
      );
    }

    return this.coursesRepository.create(createCourseDto);
  }

  async findAll(filters?: { departmentId?: string; level?: number }) {
    if (filters?.departmentId) {
      await this.departmentService.findOne(filters.departmentId);
    }
    return this.coursesRepository.findAllByFilter(filters);
  }

  async findById(id: string) {
    const course = await this.coursesRepository.findById(id);
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }
    return course;
  }

  async findByCourseCode(courseCode: string) {
    const course = await this.coursesRepository.findByCourseCode(courseCode);
    if (!course) {
      throw new NotFoundException(`Course with code ${courseCode} not found`);
    }
    return course;
  }
}
