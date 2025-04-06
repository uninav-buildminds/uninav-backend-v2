import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  DrizzleDB,
  MaterialEntity,
  MaterialTypeEnum,
  UserEntity,
} from 'src/utils/types/db.types';
import { eq, and, desc, getTableColumns } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { material } from 'src/modules/drizzle/schema/material.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { resource } from 'src/modules/drizzle/schema/resource.schema';
import { CreateResourceDto } from 'src/modules/material/dto/create-resource.dto';
import { materialLogger } from 'src/modules/material/material.module';
import { TABLES } from 'src/modules/drizzle/tables.constants';
import { userCourses as uc } from 'src/modules/drizzle/schema/user.schema';
import {
  courses,
  departmentLevelCourses as dlc,
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
        resource: true,
      },
    });
  }

  async findMaterialResource(id: string) {
    return this.db.query.resource.findFirst({
      where: eq(resource.materialId, id),
    });
  }

  async incrementDownloadCount(id: string) {
    const result = await this.db
      .update(material)
      .set({
        downloadCount: sql`${material.downloadCount} + 1`,
      } as any)
      .where(eq(material.id, id))
      .returning();
  }

  async incrementClickCount(id: string) {
    await this.db
      .update(material)
      .set({
        clickCount: sql`${material.clickCount} + 1`,
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

  async update(
    id: string,
    updateMaterialDto: Omit<
      UpdateMaterialDto,
      'resourceType' | 'resourceAddress' | 'metaData'
    > & { reviewStatus?: string },
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

  async findByType(type: MaterialTypeEnum): Promise<MaterialEntity[]> {
    return this.db.query.material.findMany({
      where: eq(material.type, type),
      with: {
        resource: true,
      },
    });
  }

  async findWithFilters(
    filters: {
      creatorId?: string;
      courseId?: string;
      type?: MaterialTypeEnum;
      tag?: string;
    },
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
    let conditions = [];
    const limit = 10;
    const offset = (page - 1) * limit;

    if (filters.creatorId) {
      conditions.push(eq(material.creatorId, filters.creatorId));
    }
    if (filters.courseId) {
      conditions.push(eq(material.targetCourse, filters.courseId));
    }
    if (filters.type) {
      conditions.push(eq(material.type, filters.type));
    }
    if (filters.tag) {
      conditions.push(sql`${filters.tag} = ANY(${material.tags})`);
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

    const data = await this.db.query.material.findMany({
      where: whereClause,
      orderBy: [
        desc(material.likes),
        desc(material.downloadCount),
        desc(material.viewCount),
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
        createdAt: false,
        updatedAt: false,
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
    query: string,
    filters: {
      creatorId?: string;
      courseId?: string;
      type?: MaterialTypeEnum;
      tag?: string;
    },
    user: UserEntity,
    page: number = 1,
  ) {
    const conditions = [];
    const limit = 10;
    const offset = (page - 1) * limit;

    // Apply filters conditionally
    if (filters.creatorId) {
      conditions.push(eq(material.creatorId, filters.creatorId));
    }
    if (filters.courseId) {
      conditions.push(eq(material.targetCourse, filters.courseId));
    }
    if (filters.type) {
      conditions.push(eq(material.type, filters.type));
    }
    if (filters.tag) {
      conditions.push(sql`${filters.tag} = ANY(${material.tags})`);
    }

    const whereCondition = sql.join(
      [
        ...conditions,
        sql<boolean>`${material.searchVector} @@ websearch_to_tsquery('english', ${query})`,
      ],
      sql` AND `,
    );

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(material)
      .where(whereCondition)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);
    let { updatedAt, createdAt, searchVector, ...rest } =
      getTableColumns(material);
    const data = await this.db
      .select({
        ...rest,
        rank: sql<number>`
        ts_rank_cd(${material.searchVector}, websearch_to_tsquery('english', ${query})) 

        + CASE 
            -- Boost if the material is for a course the user is actively taking
            WHEN EXISTS (
              SELECT 1 FROM ${uc} 
              WHERE ${uc.courseId} = ${material.targetCourse}
              AND ${uc.userId} = ${user.id}
            ) THEN 0.3 
            ELSE 0 
          END

        + CASE 
            -- Boost if material is for a course in the user's department
            WHEN ${material.targetCourse} IN (SELECT ${courses.id} FROM ${courses}  
            JOIN ${dlc}  ON ${courses.id} = ${dlc.courseId}
            WHERE ${dlc.departmentId} = ${user.departmentId}) THEN 0.2
            -- Boost if material is used at the user's level
            WHEN EXISTS (
              SELECT 1 FROM ${dlc} 
              WHERE  ${dlc.courseId} = ${material.targetCourse}
              AND ${dlc.departmentId} = ${user.departmentId}
              AND ${dlc.level} = ${user.level}
            ) THEN 0.1
            ELSE 0 
          END AS rank`,
      })
      .from(material)
      .where(whereCondition)
      .orderBy(
        desc(sql`rank`),
        desc(material.likes),
        desc(material.downloadCount),
        desc(material.viewCount),
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

  async getRecommendations(
    user: UserEntity,
    page: number = 1,
  ): Promise<{
    data: MaterialEntity[];
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

    const whereCondition = sql`${material.targetCourse} IN (
      SELECT ${courses.id} FROM ${courses}  
      JOIN ${dlc}  ON ${courses.id} = ${dlc.courseId}
      WHERE ${dlc.departmentId} = ${user.departmentId}
      AND ${dlc.level} = ${user.level}
    )`;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(material)
      .where(whereCondition)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    const data = await this.db
      .select()
      .from(material)
      .where(whereCondition)
      .orderBy(
        desc(material.likes),
        desc(material.downloadCount),
        desc(material.createdAt),
        desc(material.viewCount),
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
}
