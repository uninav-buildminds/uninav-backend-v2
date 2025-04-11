import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesRepository } from './courses.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { DepartmentService } from '../department/department.service';
import { ApprovalStatus } from 'src/utils/types/db.types';
import { courses } from '../drizzle/schema/course.schema';

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

    // Create or update course with department level
    const course = this.coursesRepository.create(createCourseDto);
    if (!course) {
      throw new BadRequestException(
        `Course ${createCourseDto.courseCode} already exists for department and level`,
      );
    }
    return course;
  }

  async findAllPaginated(filters?: {
    departmentId?: string;
    level?: number;
    reviewStatus?: ApprovalStatus;
    page?: number;
    query?: string;
  }) {
    return this.coursesRepository.findAllPaginated(filters);
  }

  async findAll(filters?: {
    departmentId?: string;
    level?: number;
    reviewStatus?: ApprovalStatus;
    page?: number;
    query?: string;
  }) {
    if (filters?.page !== undefined) {
      return this.findAllPaginated(filters);
    }
    return this.coursesRepository.findAll(filters);
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

  async review(
    courseId: string,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
    },
  ) {
    return this.coursesRepository.update(courseId, {
      reviewStatus: reviewData.reviewStatus,
      reviewedById: reviewData.reviewedById,
      updatedAt: new Date(),
    });
  }

  async remove(courseId: string) {
    const course = await this.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    return this.coursesRepository.delete(courseId);
  }

  async reviewDepartmentLevelCourse(
    departmentId: string,
    courseId: string,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
    },
  ) {
    // Verify course exists
    const course = await this.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Verify department exists
    const department = await this.departmentService.findOne(departmentId);
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    // Check if department level course exists
    const existing =
      await this.coursesRepository.findExistingDepartmentLevelCourse(
        courseId,
        departmentId,
      );
    if (!existing) {
      throw new NotFoundException(
        `Department level course not found for department ${departmentId}, course ${courseId}`,
      );
    }

    return this.coursesRepository.reviewDepartmentLevelCourse(
      departmentId,
      courseId,
      reviewData,
    );
  }

  async deleteDepartmentLevelCourse(departmentId: string, courseId: string) {
    // Verify course exists
    const course = await this.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // Verify department exists
    const department = await this.departmentService.findOne(departmentId);
    if (!department) {
      throw new NotFoundException(
        `Department with ID ${departmentId} not found`,
      );
    }

    // Check if department level course exists
    const existing =
      await this.coursesRepository.findExistingDepartmentLevelCourse(
        courseId,
        departmentId,
      );
    if (!existing) {
      throw new NotFoundException(
        `Department level course not found for department ${departmentId}, course ${courseId}`,
      );
    }

    return this.coursesRepository.deleteDepartmentLevelCourse(
      departmentId,
      courseId,
    );
  }

  async findDepartmentLevelCourses(filters?: {
    departmentId?: string;
    courseId?: string;
    reviewStatus?: ApprovalStatus;
    page?: number;
    query?: string;
  }) {
    if (filters?.departmentId) {
      await this.departmentService.findOne(filters.departmentId);
    }
    if (filters?.courseId) {
      await this.findById(filters.courseId);
    }
    return this.coursesRepository.findDepartmentLevelCoursesPaginated(filters);
  }
  async countCoursesByStatus(departmentId?: string) {
    return this.coursesRepository.countByStatus(departmentId);
  }

  async countDepartmentLevelCoursesByStatus(departmentId?: string) {
    return this.coursesRepository.countDepartmentLevelCoursesByStatus(
      departmentId,
    );
  }
}
