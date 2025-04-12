import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  ApprovalStatus,
  DrizzleDB,
  MaterialEntity,
  MaterialTypeEnum,
  UserEntity,
} from 'src/utils/types/db.types';
import {
  eq,
  and,
  desc,
  getTableColumns,
  inArray,
  ilike,
  or,
} from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { material } from 'src/modules/drizzle/schema/material.schema';
import { materialLikes } from 'src/modules/drizzle/schema/material-likes.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { resource } from 'src/modules/drizzle/schema/resource.schema';
import { CreateResourceDto } from 'src/modules/material/dto/create-resource.dto';
import { materialLogger } from 'src/modules/material/material.module';
import { TABLES } from 'src/modules/drizzle/tables.constants';
import {
  users,
  userCourses as uc,
} from 'src/modules/drizzle/schema/user.schema';
import {
  courses,
  departmentLevelCourses as dlc,
  departmentLevelCourses,
} from 'src/modules/drizzle/schema/course.schema';

@Injectable()
export class MaterialRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(
    createMaterialDto: Omit<
      CreateMaterialDto,
      'resourceType' | 'resourceAddress' | 'metaData'
    >,
  ): Promise<MaterialEntity> {
    const result = await this.db
      .insert(material)
      .values(createMaterialDto as any)
      .returning();
    return result[0];
  }

  async findAll(): Promise<MaterialEntity[]> {
    return this.db.query.material.findMany({
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            departmentId: true,
            level: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.db.query.material.findFirst({
      where: eq(material.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            departmentId: true,
            level: true,
          },
        },
        targetCourse: true,
        resource: true,
        adverts: true,
      },
    });
  }

  async findMaterialResource(id: string) {
    return this.db.query.resource.findFirst({
      where: eq(resource.materialId, id),
    });
  }

  async incrementDownloads(id: string) {
    const result = await this.db
      .update(material)
      .set({
        downloads: sql`${material.downloads} + 1`,
      } as any)
      .where(eq(material.id, id))
      .returning();
  }

  async incrementViews(id: string) {
    await this.db
      .update(material)
      .set({
        views: sql`${material.views} + 1`,
      } as any)
      .where(eq(material.id, id));
  }

  async incrementLikes(id: string): Promise<MaterialEntity> {
    const result = await this.db
      .update(material)
      .set({
        likes: sql`${material.likes} + 1`,
      } as any)
      .where(eq(material.id, id))
      .returning();
    return result[0];
  }

  async decrementLikes(id: string): Promise<MaterialEntity> {
    const result = await this.db
      .update(material)
      .set({
        likes: sql`${material.likes} - 1`,
      } as any)
      .where(eq(material.id, id))
      .returning();
    return result[0];
  }

  async update(
    id: string,
    updateMaterialDto: Omit<
      UpdateMaterialDto,
      'resourceType' | 'resourceAddress' | 'metaData'
    > & { reviewStatus?: string; reviewedById?: string },
  ): Promise<MaterialEntity> {
    materialLogger.log('updateMaterialDto', updateMaterialDto);
    console.log('updateMaterialDto', updateMaterialDto);
    const result = await this.db
      .update(material)
      .set({ ...updateMaterialDto, updatedAt: new Date() } as any)
      .where(eq(material.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string): Promise<MaterialEntity> {
    const result = await this.db
      .delete(material)
      .where(eq(material.id, id))
      .returning();
    return result[0];
  }

  async createResource(
    resourceData: Required<CreateResourceDto> & {
      materialId: string;
      fileKey: string;
    },
  ) {
    const result = await this.db
      .insert(resource)
      .values(resourceData)
      .returning();
    return result[0];
  }

  async updateResource(
    materialId: string,
    resourceData: {
      resourceAddress?: string;
      resourceType?: string;
      metaData?: string[];
      fileKey?: string;
    },
  ) {
    const result = await this.db
      .update(resource)
      .set({ ...resourceData, updatedAt: new Date() } as any)
      .where(eq(resource.materialId, materialId))
      .returning();
    return result[0];
  }

  async findByCreator(creatorId: string): Promise<MaterialEntity[]> {
    return this.db.query.material.findMany({
      where: eq(material.creatorId, creatorId),
    });
  }

  async findAllPaginated(options: {
    creatorId?: string;
    courseId?: string;
    type?: MaterialTypeEnum;
    tag?: string;
    reviewStatus?: ApprovalStatus;
    page?: number;
    query?: string;
    advancedSearch?: boolean;
  }): Promise<{
    data: Partial<MaterialEntity>[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    let { page = 1, query, advancedSearch, ...filters } = options;
    let conditions = [];
    const limit = 10;
    const offset = (page - 1) * limit;

    if (filters.creatorId) {
      conditions.push(eq(material.creatorId, filters.creatorId));
    }
    if (filters.courseId) {
      conditions.push(eq(material.targetCourseId, filters.courseId));
    }
    if (filters.type) {
      conditions.push(eq(material.type, filters.type));
    }
    if (filters.tag) {
      conditions.push(sql`${filters.tag} = ANY(${material.tags})`);
    }
    if (filters.reviewStatus) {
      conditions.push(eq(material.reviewStatus, filters.reviewStatus));
    }

    // Add text search if query is provided - using the full-text search index
    if (query && query.trim() !== '') {
      if (advancedSearch) {
        const searchCondition = or(
          ilike(material.label, `%${query}%`),
          ilike(material.description, `%${query}%`),
          sql`${query} = ANY(${material.tags})`,
        );
        conditions.push(searchCondition);
        console.log('doing advanced search');
      } else {
        conditions.push(
          or(
            sql`${material.searchVector} @@ websearch_to_tsquery('english', ${query})`,
            sql`${query} = ANY(${material.tags})`,
          ),
        );
      }
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(material)
      .where(whereClause)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Define order by
    let orderByFields = [
      desc(material.createdAt), // Default ordering
      desc(material.likes),
      desc(material.downloads),
      desc(material.views),
    ];

    // If query was provided, sort by rank first using the vector index
    if (query && query.trim() !== '') {
      orderByFields = [
        desc(
          sql`ts_rank_cd(${material.searchVector}, websearch_to_tsquery('english', ${query}))`,
        ),
        ...orderByFields,
      ];
    }
    const data = await this.db.query.material.findMany({
      where: whereClause,
      orderBy: orderByFields,
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        targetCourse: {
          columns: {
            id: true,
            courseName: true,
            courseCode: true,
          },
        },
      },
      columns: {
        searchVector: false,
      },
      limit,
      offset,
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

  async searchMaterials(
    filters: {
      query?: string;
      creatorId?: string;
      courseId?: string;
      type?: MaterialTypeEnum;
      tag?: string;
      advancedSearch?: boolean;
    },
    user: UserEntity,
    page: number = 1,
  ) {
    const conditions = [];
    const limit = 10;
    const offset = (page - 1) * limit;
    const { query } = filters;

    // Apply filters conditionally
    if (filters.creatorId) {
      conditions.push(eq(material.creatorId, filters.creatorId));
    }
    if (filters.courseId) {
      conditions.push(eq(material.targetCourseId, filters.courseId));
    }
    if (filters.type) {
      conditions.push(eq(material.type, filters.type));
    }
    if (filters.tag) {
      conditions.push(sql`${filters.tag} = ANY(${material.tags})`);
    }

    // If query is provided, use full-text search
    if (query && query.trim() !== '') {
      // Add text search if query is provided - using the full-text search index
      if (filters.advancedSearch) {
        const searchCondition = or(
          ilike(material.label, `%${query}%`),
          ilike(material.description, `%${query}%`),
          sql`${query} = ANY(${material.tags})`,
        );
        conditions.push(searchCondition);
        console.log('doing advanced search');
      } else {
        conditions.push(
          or(
            sql`${material.searchVector} @@ websearch_to_tsquery('english', ${query})`,
            sql`${query} = ANY(${material.tags})`,
          ),
        );
      }

      // Get total count for pagination with search condition
      const whereCondition =
        conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;
      const countResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(material)
        .where(whereCondition)
        .execute();

      const totalItems = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(totalItems / limit);

      // Destructure unwanted fields from material table columns
      let { searchVector, ...rest } = getTableColumns(material);

      const data = await this.db
        .select({
          ...rest,
          // Creator fields
          creator: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            username: users.username,
          },
          // Target course fields
          targetCourse: {
            id: courses.id,
            courseName: courses.courseName,
            courseCode: courses.courseCode,
          },
          rank: sql<number>`
          ts_rank_cd(${material.searchVector}, websearch_to_tsquery('english', ${query})) 

          + CASE 
              -- Boost if the material is for a course the user is actively taking
              WHEN EXISTS (
                SELECT 1 FROM ${uc} 
                WHERE ${uc.courseId} = ${material.targetCourseId}
                AND ${uc.userId} = ${user.id}
              ) THEN 0.3 
              ELSE 0 
            END

          + CASE 
              -- Boost if material is for a course in the user's department
              WHEN ${material.targetCourseId} IN (SELECT ${courses.id} FROM ${courses}  
              JOIN ${dlc}  ON ${courses.id} = ${dlc.courseId}
              WHERE ${dlc.departmentId} = ${user.departmentId}) THEN 0.2
              -- Boost if material is used at the user's level not specifically department
              WHEN EXISTS (
                SELECT 1 FROM ${dlc} 
                WHERE  ${dlc.courseId} = ${material.targetCourseId}
                AND ${dlc.level} = ${user.level}
              ) THEN 0.1
              ELSE 0 
            END AS rank`,
        })
        .from(material)
        .leftJoin(users, eq(material.creatorId, users.id))
        .leftJoin(courses, eq(material.targetCourseId, courses.id))
        .where(whereCondition)
        .orderBy(
          desc(sql`rank`),
          desc(material.likes),
          desc(material.downloads),
          desc(material.views),
          desc(material.createdAt),
        )
        .limit(limit)
        .offset(offset)
        .execute();

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
    // If no query is provided, just use the other filters and standard ordering
    else {
      // Create where clause from conditions
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count for pagination
      const countResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(material)
        .where(whereClause)
        .execute();

      const totalItems = Number(countResult[0]?.count || 0);
      const totalPages = Math.ceil(totalItems / limit);

      // Get data with standard ordering
      const data = await this.db.query.material.findMany({
        where: whereClause,
        orderBy: [
          desc(material.likes),
          desc(material.downloads),
          desc(material.views),
          desc(material.createdAt),
        ],
        with: {
          creator: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
            },
          },
          targetCourse: {
            columns: {
              id: true,
              courseName: true,
              courseCode: true,
            },
          },
        },
        columns: {
          searchVector: false,
        },
        limit,
        offset,
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
  }

  async getRecommendations(
    user: UserEntity,
    page: number = 1,
  ): Promise<{
    data: Partial<MaterialEntity>[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
      hasMore: boolean;
      hasPrev: boolean;
    };
  }> {
    const limit = 10;
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(material)
      .where(
        sql`
        ${material.targetCourseId} IN (
          SELECT ${uc.courseId}
          FROM ${uc}
          WHERE ${uc.userId} = ${user.id}
        )
      `,
      )
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Use query builder to avoid SQL syntax issues
    const subQuery = this.db
      .select({ courseId: uc.courseId })
      .from(uc)
      .where(eq(uc.userId, user.id));

    const data = await this.db.query.material.findMany({
      where: inArray(material.targetCourseId, subQuery),
      orderBy: [
        desc(material.likes),
        desc(material.downloads),
        desc(material.views),
        desc(material.createdAt),
      ],
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        targetCourse: {
          columns: {
            id: true,
            courseName: true,
            courseCode: true,
          },
        },
      },
      columns: {
        searchVector: false,
      },
      limit,
      offset,
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

  async hasUserLikedMaterial(
    materialId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.db.query.materialLikes.findFirst({
      where: and(
        eq(materialLikes.materialId, materialId),
        eq(materialLikes.userId, userId),
      ),
    });

    return !!result;
  }

  async addUserLike(materialId: string, userId: string): Promise<void> {
    await this.db.insert(materialLikes).values({
      materialId,
      userId,
    });
  }

  async removeUserLike(materialId: string, userId: string): Promise<void> {
    await this.db
      .delete(materialLikes)
      .where(
        and(
          eq(materialLikes.materialId, materialId),
          eq(materialLikes.userId, userId),
        ),
      );
  }

  async countByStatus(departmentId?: string) {
    const result = await this.db.transaction(async (tx) => {
      // Count pending
      const pendingResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(material)
        .where(
          and(
            eq(material.reviewStatus, ApprovalStatus.PENDING),
            departmentId
              ? sql`${material.targetCourseId} IN (
                SELECT ${departmentLevelCourses.courseId}
                FROM ${departmentLevelCourses}
                WHERE ${departmentLevelCourses.departmentId} = ${departmentId}
              )`
              : undefined,
          ),
        )
        .execute();

      // Count approved
      const approvedResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(material)
        .where(
          and(
            eq(material.reviewStatus, ApprovalStatus.APPROVED),
            departmentId
              ? sql`${material.targetCourseId} IN (
                SELECT ${departmentLevelCourses.courseId}
                FROM ${departmentLevelCourses}
                WHERE ${departmentLevelCourses.departmentId} = ${departmentId}
              )`
              : undefined,
          ),
        )
        .execute();

      // Count rejected
      const rejectedResult = await tx
        .select({ count: sql<number>`count(*)` })
        .from(material)
        .where(
          and(
            eq(material.reviewStatus, ApprovalStatus.REJECTED),
            departmentId
              ? sql`${material.targetCourseId} IN (
                SELECT ${departmentLevelCourses.courseId}k
                FROM ${departmentLevelCourses}
                WHERE ${departmentLevelCourses.departmentId} = ${departmentId}
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
