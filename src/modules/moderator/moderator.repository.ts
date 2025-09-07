import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB, ApprovalStatus } from 'src/utils/types/db.types';
import { moderator } from '../../../libs/common/src/modules/database/schema/moderator.schema';
import { and, eq, sql, or, ilike, desc } from 'drizzle-orm';
import { users } from '../../../libs/common/src/modules/database/schema/user.schema';

@Injectable()
export class ModeratorRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create({
    userId,
    departmentId,
  }: {
    userId: string;
    departmentId: string;
  }) {
    const [result] = await this.db
      .insert(moderator)
      .values({ userId, departmentId } as any)
      .returning();
    return result;
  }

  async findById(userId: string) {
    return this.db.query.moderator.findFirst({
      where: eq(moderator.userId, userId),
      with: {
        user: true,
        reviewedBy: {
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

  async findAll(reviewStatus?: ApprovalStatus) {
    return this.db.query.moderator.findMany({
      where: reviewStatus
        ? eq(moderator.reviewStatus, reviewStatus as ApprovalStatus)
        : undefined,
      with: {
        user: true,
        reviewedBy: {
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

  async findAllPaginated(options: {
    status?: ApprovalStatus;
    page?: number;
    query?: string;
  }): Promise<{
    data: any[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const { status, page = 1, query } = options;
    const limit = 10;
    const offset = (page - 1) * limit;

    // Build where conditions
    let conditions = [];

    if (status) {
      conditions.push(eq(moderator.reviewStatus, status));
    }

    // Add text search if query is provided
    if (query && query.trim() !== '') {
      const searchTerm = `%${query}%`;
      conditions.push(
        or(
          sql`EXISTS (
            SELECT 1 FROM ${users}
            WHERE ${users.id} = ${moderator.userId}
            AND (
              ${ilike(users.firstName, searchTerm)} OR
              ${ilike(users.lastName, searchTerm)} OR
              ${ilike(users.email, searchTerm)} OR
              ${ilike(users.username, searchTerm)}
            )
          )`,
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(moderator)
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Get paginated data with joined user information
    const data = await this.db.query.moderator.findMany({
      where: whereClause,
      with: {
        user: true,
        reviewedBy: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
      limit,
      offset,
      orderBy: [desc(moderator.createdAt)],
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

  async updateReviewStatus(
    userId: string,
    reviewData: {
      reviewStatus: ApprovalStatus;
      reviewedById: string;
    },
  ) {
    const [result] = await this.db
      .update(moderator)
      .set({
        reviewStatus: reviewData.reviewStatus as ApprovalStatus,
        reviewedById: reviewData.reviewedById,
      } as any)
      .where(eq(moderator.userId, userId))
      .returning();
    return result;
  }

  async delete(userId: string) {
    const [result] = await this.db
      .delete(moderator)
      .where(eq(moderator.userId, userId))
      .returning();
    return result;
  }

  async countByStatus(departmentId?: string) {
    const result = await this.db.transaction(async (tx) => {
      // Count pending
      const pendingResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(moderator)
        .where(
          and(
            eq(moderator.reviewStatus, ApprovalStatus.PENDING),
            departmentId ? eq(moderator.departmentId, departmentId) : undefined,
          ),
        )
        .execute();

      // Count approved
      const approvedResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(moderator)
        .where(
          and(
            eq(moderator.reviewStatus, ApprovalStatus.APPROVED),
            departmentId ? eq(moderator.departmentId, departmentId) : undefined,
          ),
        )
        .execute();

      // Count rejected
      const rejectedResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(moderator)
        .where(
          and(
            eq(moderator.reviewStatus, ApprovalStatus.REJECTED),
            departmentId ? eq(moderator.departmentId, departmentId) : undefined,
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
