import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB } from '@app/common/types/db.types';
import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { notifications } from '@app/common/modules/database/schema/notifications.schema';

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(payload: {
    userId: string;
    type: string;
    title: string;
    description: string;
    resourceId?: string | null;
  }) {
    const result = await this.db
      .insert(notifications)
      .values({ ...payload, resourceId: payload.resourceId || null } as any)
      .returning();
    return result[0];
  }

  async list(
    userId: string,
    options: {
      page?: number;
      limit?: number;
      query?: string;
      status?: 'read' | 'unread';
    },
  ) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const offset = (page - 1) * limit;

    const conditions = [eq(notifications.userId, userId)];
    if (options.status)
      conditions.push(eq(notifications.status, options.status));
    if (options.query && options.query.trim() !== '') {
      const q = options.query.trim();
      conditions.push(
        or(
          ilike(notifications.title, `%${q}%`),
          ilike(notifications.description, `%${q}%`),
        ),
      );
    }

    const where = and(...conditions);

    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(where)
      .execute();
    const total = Number(totalResult[0]?.count || 0);

    const items = await this.db
      .select()
      .from(notifications)
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      items,
      pagination: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markRead(userId: string, id: string) {
    const result = await this.db
      .update(notifications)
      .set({ status: 'read', updatedAt: new Date() } as any)
      .where(and(eq(notifications.userId, userId), eq(notifications.id, id)))
      .returning();
    return result[0];
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ status: 'read', updatedAt: new Date() } as any)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.status, 'unread' as any),
        ),
      );
  }
}
