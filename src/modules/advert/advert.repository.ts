import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  DrizzleDB,
  AdvertEntity,
  ApprovalStatus,
} from '@app/common/types/db.types';
import { eq, sql, and, desc, or, ilike } from 'drizzle-orm';
import { advert } from '@app/common/modules/database/schema/advert.schema';
import { CreateFreeAdvertDto } from './dto/create-free-advert.dto';
import { material } from '@app/common/modules/database/schema/material.schema';
import { departmentLevelCourses } from '@app/common/modules/database/schema/course.schema';

@Injectable()
export class AdvertRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(
    createAdvertData: CreateFreeAdvertDto & {
      imageUrl: string;
      fileKey: string;
    },
  ): Promise<AdvertEntity> {
    const result = await this.db
      .insert(advert)
      .values(createAdvertData as any)
      .returning();
    return result[0];
  }

  async findAll(): Promise<AdvertEntity[]> {
    return this.db.query.advert.findMany({
      with: {
        material: true,
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<AdvertEntity> {
    return this.db.query.advert.findFirst({
      where: eq(advert.id, id),
      with: {
        material: true,
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async findByMaterial(materialId: string): Promise<AdvertEntity[]> {
    return this.db.query.advert.findMany({
      where: eq(advert.materialId, materialId),
      with: {
        material: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async findByCollection(collectionId: string): Promise<AdvertEntity[]> {
    return this.db.query.advert.findMany({
      where: eq(advert.collectionId, collectionId),
      with: {
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async findByCreator(creatorId: string): Promise<AdvertEntity[]> {
    return this.db.query.advert.findMany({
      where: eq(advert.creatorId, creatorId),
      with: {
        material: true,
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async update(id: string, updateData: Partial<AdvertEntity>): Promise<void> {
    await this.db
      .update(advert)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(eq(advert.id, id));
  }

  async incrementViews(id: string): Promise<void> {
    await this.db
      .update(advert)
      .set({
        views: sql`${advert.views} + 1`,
        updatedAt: new Date(),
      } as any)
      .where(eq(advert.id, id));
  }

  async incrementClicks(id: string): Promise<void> {
    await this.db
      .update(advert)
      .set({
        clicks: sql`${advert.clicks} + 1`,
      } as any)
      .where(eq(advert.id, id));
  }

  async remove(id: string): Promise<AdvertEntity> {
    const result = await this.db
      .delete(advert)
      .where(eq(advert.id, id))
      .returning();
    return result[0];
  }

  async findAllPaginated(
    options: {
      reviewStatus?: ApprovalStatus;
      page?: number;
      query?: string;
    },
    includeReviewer?: boolean,
  ): Promise<{
    data: AdvertEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const { reviewStatus, page = 1, query } = options;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];

    if (reviewStatus) {
      whereConditions.push(eq(advert.reviewStatus, reviewStatus));
    }

    // Add text search if query is provided
    if (query && query.trim() !== '') {
      const searchTerm = `%${query}%`;
      const searchCondition = or(
        ilike(advert.label, searchTerm),
        ilike(advert.description, searchTerm),
      );
      whereConditions.push(searchCondition);
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(advert)
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.advert.findMany({
      where: whereClause,
      with: {
        material: true,
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        ...(includeReviewer
          ? {
              reviewedBy: {
                columns: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  username: true,
                },
              },
            }
          : {}),
      },
      offset,
      limit,
      orderBy: [desc(advert.createdAt)],
    });

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasMore: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async countByStatus(departmentId?: string) {
    const result = await this.db.transaction(async (tx) => {
      // Count pending
      const pendingResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(advert)
        .where(
          and(
            eq(advert.reviewStatus, ApprovalStatus.PENDING),
            departmentId
              ? sql`${advert.materialId} IN (
              SELECT ${material.id} 
              FROM ${material}
              WHERE ${material.targetCourseId} IN (
                SELECT ${departmentLevelCourses.courseId}
                FROM ${departmentLevelCourses}
                WHERE ${departmentLevelCourses.departmentId} = ${departmentId}
              )
            )`
              : undefined,
          ),
        )
        .execute();

      // Count approved
      const approvedResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(advert)
        .where(
          and(
            eq(advert.reviewStatus, ApprovalStatus.APPROVED),
            departmentId
              ? sql`${advert.materialId} IN (
              SELECT ${material.id} 
              FROM ${material}
              WHERE ${material.targetCourseId} IN (
                SELECT ${departmentLevelCourses.courseId}
                FROM ${departmentLevelCourses}
                WHERE ${departmentLevelCourses.departmentId} = ${departmentId}
              )
            )`
              : undefined,
          ),
        )
        .execute();

      // Count rejected
      const rejectedResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(advert)
        .where(
          and(
            eq(advert.reviewStatus, ApprovalStatus.REJECTED),
            departmentId
              ? sql`${advert.materialId} IN (
              SELECT ${material.id} 
              FROM ${material}
              WHERE ${material.targetCourseId} IN (
                SELECT ${departmentLevelCourses.courseId}
                FROM ${departmentLevelCourses}
                WHERE ${departmentLevelCourses.departmentId} = ${departmentId}
              )
            )`
              : undefined,
          ),
        )
        .execute();

      return {
        pending: Number(pendingResult[0]?.count || 0),
        approved: Number(approvedResult[0]?.count || 0),
        rejected: Number(rejectedResult[0]?.count || 0),
      };
    });

    return result;
  }
}
