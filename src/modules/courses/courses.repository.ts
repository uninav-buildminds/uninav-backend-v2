import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { CourseEntity, DrizzleDB } from 'src/utils/types/db.types';
import { CreateCourseDto } from './dto/create-course.dto';
import { and, eq, or } from 'drizzle-orm';
import {
  courses,
  departmentLevelCourses,
} from '../drizzle/schema/course.schema';

@Injectable()
export class CoursesRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async findExistingDepartmentLevelCourse(
    courseId: string,
    departmentId: string,
    level: number,
  ) {
    return await this.db.query.departmentLevelCourses.findFirst({
      where: and(
        eq(departmentLevelCourses.courseId, courseId),
        eq(departmentLevelCourses.departmentId, departmentId),
        eq(departmentLevelCourses.level, level),
      ),
    });
  }

  async createDepartmentLevelCourse(
    courseId: string,
    departmentId: string,
    level: number,
  ) {
    return await this.db
      .insert(departmentLevelCourses)
      .values({
        departmentId,
        courseId,
        level,
      } as any)
      .returning();
  }

  async create(createCourseDto: CreateCourseDto) {
    const { departmentId, level, ...courseData } = createCourseDto;

    return await this.db.transaction(async (tx) => {
      // Try to find existing course
      const existingCourse = await tx.query.courses.findFirst({
        where: or(
          eq(courses.courseCode, courseData.courseCode),
          eq(courses.courseName, courseData.courseName),
        ),
      });

      let course;
      if (existingCourse) {
        course = existingCourse;
      } else {
        // Create new course if it doesn't exist
        [course] = await tx
          .insert(courses)
          .values(courseData as any)
          .returning();
      }

      // Check if department-level course combination already exists
      const existingDeptLevel = await tx.query.departmentLevelCourses.findFirst(
        {
          where: and(
            eq(departmentLevelCourses.courseId, course.id),
            eq(departmentLevelCourses.departmentId, departmentId),
            eq(departmentLevelCourses.level, level),
          ),
        },
      );

      if (!existingDeptLevel) {
        // Create new department-level course relationship
        await tx.insert(departmentLevelCourses).values({
          departmentId,
          courseId: course.id,
          level,
        } as any);
      } else {
        return null;
      }
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

  async findByCourseCode(courseCode: string) {
    return this.db.query.courses.findFirst({
      where: eq(courses.courseCode, courseCode),
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

  async findByCourseCodeOrName(courseCode: string, courseName: string) {
    return this.db.query.courses.findFirst({
      where: or(
        eq(courses.courseCode, courseCode),
        eq(courses.courseName, courseName),
      ),
    });
  }
}
