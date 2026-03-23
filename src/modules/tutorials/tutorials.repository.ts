import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from '@app/common/types/db.types';
import {
  tutorials,
  modules,
  lessons,
  enrollments,
} from '@app/common/modules/database/schema/tutorials.schema';
import { and, eq, desc, asc, ilike } from 'drizzle-orm';
import { TutorialFilterDto } from './dto/tutorial-filter.dto';

@Injectable()
export class TutorialsRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async findAll(filters: TutorialFilterDto) {
    const conditions = [];

    if (filters.courseCode) {
      conditions.push(ilike(tutorials.courseCode, `%${filters.courseCode}%`));
    }

    if (filters.level) {
      conditions.push(eq(tutorials.level, filters.level));
    }

    if (filters.departmentId) {
      conditions.push(eq(tutorials.departmentId, filters.departmentId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    return this.db.query.tutorials.findMany({
      where: whereClause,
      with: {
        tutor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: true,
      },
      orderBy: [desc(tutorials.createdAt)],
    });
  }

  async findById(id: string) {
    return this.db.query.tutorials.findFirst({
      where: eq(tutorials.id, id),
      with: {
        tutor: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        department: true,
        modules: {
          with: {
            lessons: {
              orderBy: [asc(lessons.order)],
            },
          },
          orderBy: [asc(modules.order)],
        },
      },
    });
  }

  async findEnrollment(userId: string, tutorialId: string) {
    return this.db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.userId, userId),
        eq(enrollments.tutorialId, tutorialId),
      ),
    });
  }

  async enroll(userId: string, tutorialId: string) {
    return this.db
      .insert(enrollments)
      .values({
        userId,
        tutorialId,
      })
      .returning();
  }
}
