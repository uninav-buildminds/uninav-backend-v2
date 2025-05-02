import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CoursesRepository } from './courses.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { DepartmentService } from '../department/department.service';
import {
  ApprovalStatus,
  UserEntity,
  UserRoleEnum,
} from 'src/utils/types/db.types';
import { LinkCourseDto } from './dto/link-course.dto';
import { UserService } from 'src/modules/user/user.service';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly departmentService: DepartmentService,
    private readonly userService: UserService,
  ) {}

  async create(createCourseDto: CreateCourseDto, user: UserEntity) {
    // Verify department exists
    const department = await this.departmentService.findOne(
      createCourseDto.departmentId,
    );

    if (!department) {
      throw new BadRequestException(
        `Department with ID ${createCourseDto.departmentId} not found`,
      );
    }

    createCourseDto.creatorId = user.id;
    if (user.role === UserRoleEnum.ADMIN) {
      createCourseDto.reviewStatus = ApprovalStatus.APPROVED;
      createCourseDto.reviewedById = user.id;
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

  async linkCourseToDepartment(linkCourseDto: LinkCourseDto, user: UserEntity) {
    // Verify course exists
    const course = await this.findById(linkCourseDto.courseId);
    if (!course) {
      throw new NotFoundException(
        `Course with ID ${linkCourseDto.courseId} not found`,
      );
    }

    // Verify department exists
    const department = await this.departmentService.findOne(
      linkCourseDto.departmentId,
    );

    if (!department) {
      throw new NotFoundException(
        `Department with ID ${linkCourseDto.departmentId} not found`,
      );
    }

    // Check if this department-level course combination already exists
    const existingDLC =
      await this.coursesRepository.findExistingDepartmentLevelCourse(
        linkCourseDto.courseId,
        linkCourseDto.departmentId,
      );

    if (existingDLC) {
      throw new BadRequestException(
        `This course is already linked to this department for level ${existingDLC.level}`,
      );
    }

    // Create the department level course link with appropriate review status
    const reviewStatus =
      user.role === UserRoleEnum.ADMIN
        ? ApprovalStatus.APPROVED
        : ApprovalStatus.PENDING;

    const reviewedById = user.role === UserRoleEnum.ADMIN ? user.id : null;

    const result = await this.coursesRepository.createDepartmentLevelCourse(
      linkCourseDto.courseId,
      linkCourseDto.departmentId,
      linkCourseDto.level,
      reviewStatus,
      reviewedById,
    );

    return result[0];
  }

  async findAllPaginated(filters?: {
    departmentId?: string;
    level?: number;
    reviewStatus?: ApprovalStatus;
    page?: number;
    query?: string;
    allowDepartments?: boolean;
  }) {
    return this.coursesRepository.findAllPaginated(filters);
  }

  async findAll(filters?: {
    departmentId?: string;
    level?: number;
    reviewStatus?: ApprovalStatus;
    page?: number;
    query?: string;
    allowDepartments?: boolean;
  }) {
    if (filters?.page) {
      return this.findAllPaginated(filters);
    }
    return this.coursesRepository.findAll({
      ...filters,
      allowDepartments: filters?.allowDepartments,
    });
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

  async remove(courseId: string, userId) {
    const course = await this.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    let user = await this.userService.findOne(userId);
    // Check if the user is the creator or an admin
    if (course.creatorId !== user.id && user.role !== UserRoleEnum.ADMIN) {
      throw new BadRequestException(
        `You do not have permission to delete this course`,
      );
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

  async update(id: string, updateCourseDto: UpdateCourseDto, user: UserEntity) {
    const course = await this.findById(id);
    if (!course) {
      throw new NotFoundException(`Course with ID ${id} not found`);
    }

    // Only admins can update courses
    if (user.role !== UserRoleEnum.ADMIN) {
      throw new BadRequestException('Only admins can update courses');
    }

    return this.coursesRepository.update(id, updateCourseDto);
  }
}
