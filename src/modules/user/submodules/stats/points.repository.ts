import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from '@app/common/types/db.types';
import { points } from '@app/common/modules/database/schema/points.schema';
import { eq, and, gte, sql } from 'drizzle-orm';

@Injectable()
export class PointsRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  /**
   * Allocate points to a user for a specific date
   * Only creates if no points exist for that user on that date
   */
  async allocatePoints(userId: string, amount: number = 1): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Check if points already exist for today by comparing date part of createdAt
    const existing = await this.db
      .select()
      .from(points)
      .where(
        and(
          eq(points.userId, userId),
          sql`DATE(${points.createdAt}) = ${today}`,
        ),
      )
      .limit(1)
      .execute();

    // If points already exist for today, return false (no new points allocated)
    if (existing.length > 0) {
      return false;
    }

    // Create new points record
    await this.db.insert(points).values({
      userId,
      amount,
    } as any);

    return true;
  }

  /**
   * Get total points for a user in the last N days
   */
  async getPointsInLastNDays(
    userId: string,
    days: number = 30,
  ): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${points.amount}), 0)` })
      .from(points)
      .where(and(eq(points.userId, userId), gte(points.createdAt, startDate)))
      .execute();

    return Number(result[0]?.total || 0);
  }

  /**
   * Get total points for a user (all time)
   */
  async getTotalPoints(userId: string): Promise<number> {
    const result = await this.db
      .select({ total: sql<number>`COALESCE(SUM(${points.amount}), 0)` })
      .from(points)
      .where(eq(points.userId, userId))
      .execute();

    return Number(result[0]?.total || 0);
  }

  /**
   * Allocate points immediately without checking daily limits
   * Used for uploads and downloads
   */
  async allocatePointsImmediate(userId: string, amount: number): Promise<void> {
    await this.db.insert(points).values({
      userId,
      amount,
    } as any);
  }
}
