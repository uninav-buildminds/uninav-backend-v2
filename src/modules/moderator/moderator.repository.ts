import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB, ApprovalStatus } from 'src/utils/types/db.types';
import { moderator } from '../drizzle/schema/moderator.schema';
import { eq } from 'drizzle-orm';
import { users } from '../drizzle/schema/user.schema';

@Injectable()
export class ModeratorRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(userId: string) {
    const [result] = await this.db
      .insert(moderator)
      .values({ userId })
      .returning();
    return result;
  }

  async findById(userId: string) {
    return this.db.query.moderator.findFirst({
      where: eq(moderator.userId, userId),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            role: true,
          },
        },
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
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            role: true,
          },
        },
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
}
