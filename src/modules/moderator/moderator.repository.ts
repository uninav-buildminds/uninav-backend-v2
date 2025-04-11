import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB, ApprovalStatus } from 'src/utils/types/db.types';
import { moderator } from '../drizzle/schema/moderator.schema';
import { and, eq, sql } from 'drizzle-orm';
import { users } from '../drizzle/schema/user.schema';

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
