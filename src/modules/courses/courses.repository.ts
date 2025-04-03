import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { CourseEntity, DrizzleDB } from 'src/utils/types/db.types';
import { CreateCourseDto } from './dto/create-course.dto';
import { and, eq } from 'drizzle-orm';
import {
  courses,
  departmentLevelCourses,
} from '../drizzle/schema/course.schema';

@Injectable()
export class CoursesRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(createCourseDto: CreateCourseDto) {
    const { departmentId, level, ...courseData } = createCourseDto;

    // Start a transaction
    return await this.db.transaction(async (tx) => {
      // Create the course
      const [course] = await tx.insert(courses).values(courseData).returning();

      // Create department-level course relationship
      await tx.insert(departmentLevelCourses).values({
        departmentId: departmentId,
        courseId: course.id,
        level: level,
      } as any);

      return course;
    });
  }

  async findAllByFilter(filters?: { departmentId?: string; level?: number }) {
    // Base query to get all courses with department info but without deep nesting
    const query = this.db
      .select({
        id: courses.id,
        courseName: courses.courseName,
        courseCode: courses.courseCode,
        description: courses.description,
        reviewStatus: courses.reviewStatus,
        departmentId: departmentLevelCourses.departmentId,
        level: departmentLevelCourses.level,
      })
      .from(courses)
      .leftJoin(
        departmentLevelCourses,
        eq(courses.id, departmentLevelCourses.courseId),
      );
    let conditions = [];

    // Apply filters if provided
    if (filters?.departmentId) {
      conditions.push(
        eq(departmentLevelCourses.departmentId, filters.departmentId),
      );
    }
    if (filters?.level) {
      conditions.push(eq(departmentLevelCourses.level, filters.level));
    }

    if (conditions.length > 0) {
      // query.where(and(...conditions, eq(courses.reviewStatus, 'approved')));
      // !Testing
      query.where(and(...conditions));
    }
    return await query;
  }

  async findById(id: string) {
    // Detailed query with all relations for single course
    return this.db.query.courses.findFirst({
      where: eq(courses.id, id),
      with: {
        departmentCourses: {
          with: {
            department: {
              with: {
                faculty: true,
              },
            },
          },
        },
      },
    });
  }
}
