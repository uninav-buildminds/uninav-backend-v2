import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  ClubClickEntity,
  ClubEntity,
  ClubFlagEntity,
  ClubFlagStatusEnum,
  ClubRequestEntity,
  ClubRequestStatusEnum,
  ClubStatusEnum,
  DrizzleDB,
} from '@app/common/types/db.types';
import { eq, sql, and, desc, or, ilike } from 'drizzle-orm';
import {
  clubs,
  clubTargetDepartments,
  clubClicks,
  clubFlags,
  clubRequests,
} from '@app/common/modules/database/schema/clubs.schema';
import { CreateClubDto } from './dto/create-club.dto';
import { CreateClubRequestDto } from './dto/create-club-request.dto';

@Injectable()
export class ClubsRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  // Main club CRUD operations
  async create(
    clubData: Omit<CreateClubDto, 'targetDepartmentIds'> & {
      imageUrl?: string;
      imageKey?: string;
    },
  ): Promise<ClubEntity> {
    const result = await this.db
      .insert(clubs)
      .values(clubData as any)
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

  async findOne(id: string): Promise<ClubEntity | undefined> {
    return this.db.query.clubs.findFirst({
      where: eq(clubs.id, id),
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

  async getClickCount(clubId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(clubClicks)
      .where(eq(clubClicks.clubId, clubId))
      .execute();
    return Number(result[0]?.count || 0);
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

  // Clicks tracking
  async createClick(data: {
    clubId: string;
    userId?: string;
    departmentId?: string;
  }): Promise<ClubClickEntity> {
    const result = await this.db.insert(clubClicks).values(data).returning();
    return result[0];
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
