import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  ClubEntity,
  ClubFlagEntity,
  ClubFlagStatusEnum,
  ClubJoinEntity,
  ClubRequestEntity,
  ClubRequestStatusEnum,
  ClubStatusEnum,
  DrizzleDB,
} from '@app/common/types/db.types';
import { eq, sql, and, desc, or, ilike, gte } from 'drizzle-orm';
import {
  clubs,
  clubTargetDepartments,
  clubJoins,
  clubFlags,
  clubRequests,
} from '@app/common/modules/database/schema/clubs.schema';
import { CreateClubDto } from './dto/create-club.dto';
import { CreateClubRequestDto } from './dto/create-club-request.dto';

@Injectable()
export class ClubsRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  private generateSlug(name: string, id: string): string {
    const base = (name || 'club')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s_]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 100) || 'club';
    return `${base}_${id.substring(0, 8)}`;
  }

  // Main club CRUD operations
  async create(
    clubData: Omit<CreateClubDto, 'targetDepartmentIds'> & {
      imageUrl?: string;
      imageKey?: string;
    },
  ): Promise<ClubEntity> {
    const id = randomUUID();
    const slug = this.generateSlug((clubData as any).name, id);
    const result = await this.db
      .insert(clubs)
      .values({ ...clubData, id, slug } as any)
      .returning();
    return result[0];
  }

  async findAllPaginated(options: {
    search?: string;
    interest?: string;
    departmentId?: string;
    status?: ClubStatusEnum;
    organizerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ClubEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const {
      search,
      interest,
      departmentId,
      status,
      organizerId,
      page = 1,
      limit = 10,
    } = options;
    const offset = (page - 1) * limit;

    const whereConditions = [];

    if (status) {
      whereConditions.push(eq(clubs.status, status));
    }

    if (organizerId) {
      whereConditions.push(eq(clubs.organizerId, organizerId));
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search}%`;
      whereConditions.push(
        or(ilike(clubs.name, searchTerm), ilike(clubs.description, searchTerm)),
      );
    }

    if (interest && interest.trim() !== '') {
      whereConditions.push(sql`${interest} = ANY(${clubs.interests})`);
    }

    if (departmentId) {
      whereConditions.push(
        sql`${clubs.id} IN (
          SELECT ${clubTargetDepartments.clubId}
          FROM ${clubTargetDepartments}
          WHERE ${clubTargetDepartments.departmentId} = ${departmentId}
        )`,
      );
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(clubs)
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.clubs.findMany({
      where: whereClause,
      with: {
        organizer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profilePicture: true,
          },
        },
        targetDepartments: {
          with: {
            department: true,
          },
        },
      },
      offset,
      limit,
      orderBy: [desc(clubs.createdAt)],
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

  private readonly clubWithRelations = {
    organizer: {
      columns: {
        id: true as const,
        firstName: true as const,
        lastName: true as const,
        username: true as const,
        profilePicture: true as const,
      },
    },
    targetDepartments: {
      with: {
        department: true as const,
      },
    },
  };

  async findOne(id: string): Promise<ClubEntity | undefined> {
    return this.db.query.clubs.findFirst({
      where: eq(clubs.id, id),
      with: this.clubWithRelations,
    });
  }

  async findBySlug(slug: string): Promise<ClubEntity | undefined> {
    return this.db.query.clubs.findFirst({
      where: eq(clubs.slug, slug),
      with: this.clubWithRelations,
    });
  }

  async update(
    id: string,
    updateData: Partial<ClubEntity>,
  ): Promise<ClubEntity> {
    const result = await this.db
      .update(clubs)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(eq(clubs.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string): Promise<ClubEntity> {
    const result = await this.db
      .delete(clubs)
      .where(eq(clubs.id, id))
      .returning();
    return result[0];
  }

  // For setting the target departments of a club
  async setTargetDepartments(
    clubId: string,
    departmentIds: string[],
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx
        .delete(clubTargetDepartments)
        .where(eq(clubTargetDepartments.clubId, clubId));

      if (departmentIds.length > 0) {
        await tx.insert(clubTargetDepartments).values(
          departmentIds.map((departmentId) => ({
            clubId,
            departmentId,
          })),
        );
      }
    });
  }

  // Click tracking — anonymous-safe, increments counter atomically
  async incrementClickCount(clubId: string): Promise<number> {
    const result = await this.db
      .update(clubs)
      .set({ clickCount: sql<number>`${clubs.clickCount} + 1` } as any)
      .where(eq(clubs.id, clubId))
      .returning();
    return result[0]?.clickCount ?? 0;
  }

  // Join tracking — authenticated users only, unique per user
  async findJoin(clubId: string, userId: string): Promise<ClubJoinEntity | undefined> {
    return this.db.query.clubJoins.findFirst({
      where: and(eq(clubJoins.clubId, clubId), eq(clubJoins.userId, userId)),
    });
  }

  async createJoin(clubId: string, userId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.insert(clubJoins).values({ clubId, userId }).onConflictDoNothing();
      await tx
        .update(clubs)
        .set({ joinCount: sql<number>`${clubs.joinCount} + 1` } as any)
        .where(eq(clubs.id, clubId));
    });
  }

  // Analytics aggregation
  async getAnalytics(clubId: string): Promise<{
    totalClicks: number;
    totalJoins: number;
    joinTrend: { date: string; joins: number }[];
  }> {
    const since14 = new Date();
    since14.setDate(since14.getDate() - 13);
    since14.setHours(0, 0, 0, 0);

    const [clubResult, joinTrendResult] = await Promise.all([
      // Totals from counter columns
      this.db
        .select({ clickCount: clubs.clickCount, joinCount: clubs.joinCount })
        .from(clubs)
        .where(eq(clubs.id, clubId))
        .execute(),

      // Join trend — last 14 days, grouped by day
      this.db
        .select({
          date: sql<string>`DATE(${clubJoins.createdAt})::text`,
          joins: sql<number>`count(*)`,
        })
        .from(clubJoins)
        .where(
          and(
            eq(clubJoins.clubId, clubId),
            gte(clubJoins.createdAt, since14),
          ),
        )
        .groupBy(sql`DATE(${clubJoins.createdAt})`)
        .orderBy(sql`DATE(${clubJoins.createdAt})`)
        .execute(),
    ]);

    return {
      totalClicks: Number(clubResult[0]?.clickCount || 0),
      totalJoins: Number(clubResult[0]?.joinCount || 0),
      joinTrend: joinTrendResult.map((r) => ({
        date: r.date,
        joins: Number(r.joins),
      })),
    };
  }

  // Club flagging methods
  async createFlag(data: {
    clubId: string;
    reporterId: string;
    reason: string;
  }): Promise<ClubFlagEntity> {
    const result = await this.db.insert(clubFlags).values(data).returning();
    return result[0];
  }

  async findFlagsPaginated(options: {
    status?: ClubFlagStatusEnum;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ClubFlagEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const { status, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const whereConditions = [];
    if (status) {
      whereConditions.push(eq(clubFlags.status, status));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(clubFlags)
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.clubFlags.findMany({
      where: whereClause,
      with: {
        club: true,
        reporter: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      offset,
      limit,
      orderBy: [desc(clubFlags.createdAt)],
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

  async updateFlag(
    flagId: string,
    data: Partial<ClubFlagEntity>,
  ): Promise<ClubFlagEntity> {
    const result = await this.db
      .update(clubFlags)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(clubFlags.id, flagId))
      .returning();
    return result[0];
  }

  // Club request methods
  async createRequest(
    data: Omit<CreateClubRequestDto, 'requesterId'> & { requesterId: string },
  ): Promise<ClubRequestEntity> {
    const result = await this.db.insert(clubRequests).values(data).returning();
    return result[0];
  }

  async findRequestsPaginated(options: {
    status?: ClubRequestStatusEnum;
    page?: number;
    limit?: number;
  }): Promise<{
    data: ClubRequestEntity[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const { status, page = 1, limit = 10 } = options;
    const offset = (page - 1) * limit;

    const whereConditions = [];
    if (status) {
      whereConditions.push(eq(clubRequests.status, status));
    }

    const whereClause =
      whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(clubRequests)
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db.query.clubRequests.findMany({
      where: whereClause,
      with: {
        requester: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      offset,
      limit,
      orderBy: [desc(clubRequests.createdAt)],
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

  async updateRequest(
    requestId: string,
    data: Partial<ClubRequestEntity>,
  ): Promise<ClubRequestEntity> {
    const result = await this.db
      .update(clubRequests)
      .set({ ...data, updatedAt: new Date() } as any)
      .where(eq(clubRequests.id, requestId))
      .returning();
    return result[0];
  }
}
