import { Inject, Injectable } from '@nestjs/common';
import {
  DRIZZLE_SYMBOL,
  MAX_RECENT_ENTRIES_PER_USER,
} from 'src/utils/config/constants.config';
import {
  ApprovalStatus,
  DrizzleDB,
  MaterialEntity,
  UserEntity,
} from '@app/common/types/db.types';
import {
  eq,
  and,
  desc,
  getTableColumns,
  inArray,
  notInArray,
  ilike,
  or,
} from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { material } from '@app/common/modules/database/schema/material.schema';
import { materialLikes } from '@app/common/modules/database/schema/material-likes.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { resource } from '@app/common/modules/database/schema/resource.schema';
import { CreateResourceDto } from 'src/modules/material/dto/create-resource.dto';
import { materialLogger } from 'src/modules/material/material.module';
import {
  users,
  userCourses as uc,
  bookmarks,
} from '@app/common/modules/database/schema/user.schema';
import {
  courses,
  departmentLevelCourses as dlc,
  departmentLevelCourses,
} from '@app/common/modules/database/schema/course.schema';
import { extractCourseCode } from 'src/utils/util';
import { MaterialQueryDto } from './dto/material-query.dto';
import { recent } from '@app/common/modules/database/schema/recent.schema';
import { readingProgress } from '@app/common/modules/database/schema/reading-progress.schema';
import { SaveReadingProgressDto } from './dto/save-reading-progress.dto';
import { searchHistory } from '@app/common/modules/database/schema/search-history.schema';

@Injectable()
export class MaterialRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(
    createMaterialDto: Omit<
      CreateMaterialDto,
      'resourceType' | 'resourceAddress'
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
            profilePicture: true,
            departmentId: true,
            level: true,
          },
        },
        targetCourse: true,
        resource: true,
        adverts: true,
        folders: {
          with: {
            folder: {
              with: {
                creator: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
                content: true,
              },
            },
          },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return this.db.query.material.findFirst({
      where: eq(material.slug, slug),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profilePicture: true,
            departmentId: true,
            level: true,
          },
        },
        targetCourse: true,
        resource: true,
        adverts: true,
        folders: {
          with: {
            folder: {
              with: {
                creator: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
                content: true,
              },
            },
          },
        },
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
    > & { reviewStatus?: string; reviewedById?: string; previewUrl?: string },
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
      metaData?: any;
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

  // Store search history for authenticated users
  private async storeSearchHistory(
    userId: string,
    query: string,
  ): Promise<void> {
    if (!query || !query.trim()) return;

    try {
      await this.db
        .insert(searchHistory)
        .values({
          userId,
          query: query.trim(),
        })
        .execute();
    } catch (error) {
      // Log but don't fail the search if history storage fails
      materialLogger.warn('Failed to store search history', error);
    }
  }

  async searchMaterial(
    options: MaterialQueryDto,
    user?: UserEntity,
    includeReviewer?: boolean,
  ): Promise<{
    items: Partial<MaterialEntity>[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
    usedAdvanced?: boolean;
  }> {
    let {
      page = 1,
      query,
      advancedSearch,
      ignorePreference = false,
      ...filters
    } = options;
    let conditions = [];
    const limit = 10;
    const offset = (page - 1) * limit;

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
    if (filters.reviewStatus) {
      conditions.push(eq(material.reviewStatus, filters.reviewStatus));
    }

    // Normalize query for case-insensitive search
    const normalizedQuery = query?.trim() || '';
    const queryLower = normalizedQuery.toLowerCase();

    // Add text search if query is provided
    if (normalizedQuery) {
      const courseCodeIfExists =
        extractCourseCode(normalizedQuery)?.toLowerCase();
      if (advancedSearch) {
        // Advanced search: case-insensitive ILIKE on multiple fields
        const searchCondition = or(
          ilike(material.label, `%${normalizedQuery}%`),
          ilike(material.description, `%${normalizedQuery}%`),
          sql`${queryLower} ILIKE ANY(${material.tags})`,
          sql`EXISTS (
            SELECT 1 FROM ${courses} 
            WHERE ${courses.id} = ${material.targetCourseId} 
            AND (
              ${courseCodeIfExists ? sql`LOWER(${courses.courseCode}) LIKE ${`%${courseCodeIfExists}%`} OR` : sql`FALSE OR`}
              LOWER(${courses.courseName}) LIKE ${`%${queryLower}%`} OR 
              LOWER(${courses.description}) LIKE ${`%${queryLower}%`}
            )
          )`,
        );
        conditions.push(searchCondition);
      } else {
        // Normal search: use pgvector (faster) with case-insensitive tag matching
        conditions.push(
          or(
            sql`${material.searchVector} @@ websearch_to_tsquery('english', ${normalizedQuery})`,
            sql`${queryLower} ILIKE ANY(${material.tags})`,
            courseCodeIfExists
              ? sql`LOWER(${courseCodeIfExists}) = ANY(SELECT LOWER(unnest(${material.tags})))`
              : sql`FALSE`,
          ),
        );
      }
    }

    let whereCondition =
      conditions.length > 0 ? sql.join(conditions, sql` AND `) : undefined;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(material)
      .where(whereCondition)
      .execute();

    let totalItems = Number(countResult[0]?.count || 0);
    let totalPages = Math.ceil(totalItems / limit);
    let usedAdvanced = advancedSearch || false;

    // Automatic fallback to advanced search if normal search returns no results
    if (!advancedSearch && normalizedQuery && totalItems === 0) {
      const courseCodeIfExists =
        extractCourseCode(normalizedQuery)?.toLowerCase();

      // Rebuild conditions with advanced search instead of normal search
      // Remove the last condition (normal search) and add advanced search
      const advancedConditions = conditions.slice(0, -1); // Remove last condition (normal search)

      // Add advanced search condition
      const advancedSearchCondition = or(
        ilike(material.label, `%${normalizedQuery}%`),
        ilike(material.description, `%${normalizedQuery}%`),
        sql`${queryLower} ILIKE ANY(${material.tags})`,
        sql`EXISTS (
          SELECT 1 FROM ${courses} 
          WHERE ${courses.id} = ${material.targetCourseId} 
          AND (
            ${courseCodeIfExists ? sql`LOWER(${courses.courseCode}) LIKE ${`%${courseCodeIfExists}%`} OR` : sql`FALSE OR`}
            LOWER(${courses.courseName}) LIKE ${`%${queryLower}%`} OR 
            LOWER(${courses.description}) LIKE ${`%${queryLower}%`}
          )
        )`,
      );
      advancedConditions.push(advancedSearchCondition);

      whereCondition = sql.join(advancedConditions, sql` AND `);

      // Re-count with advanced search
      const advancedCountResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(material)
        .where(whereCondition)
        .execute();

      totalItems = Number(advancedCountResult[0]?.count || 0);
      totalPages = Math.ceil(totalItems / limit);
      usedAdvanced = true;
    }

    // Store search history for authenticated users (only on first page)
    if (user && normalizedQuery && page === 1) {
      await this.storeSearchHistory(user.id, normalizedQuery);
    }

    // Use preference-based search with user ranking if user is provided and ignorePreference is false
    if (!ignorePreference && user && normalizedQuery) {
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
          ...(includeReviewer
            ? {
                reviewedBy: {
                  id: users.id,
                  firstName: users.firstName,
                  lastName: users.lastName,
                  username: users.username,
                },
              }
            : {}),

          rank: sql<number>`
          ts_rank_cd(${material.searchVector}, websearch_to_tsquery('english', ${normalizedQuery})) 

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
        items: data,
        pagination: {
          total: totalItems,
          page,
          pageSize: limit,
          totalPages,
        },
        usedAdvanced,
      };
    } else {
      // Use standard search without user preferences
      // Destructure unwanted fields from material table columns
      let { searchVector, ...rest } = getTableColumns(material);

      // Build order by clause
      const orderByClause = [];

      // If query was provided, sort by rank first using the vector index
      if (normalizedQuery) {
        orderByClause.push(
          desc(
            sql`ts_rank_cd(${material.searchVector}, websearch_to_tsquery('english', ${normalizedQuery}))`,
          ),
        );
      }

      // Add default ordering
      orderByClause.push(
        desc(material.createdAt),
        desc(material.likes),
        desc(material.downloads),
        desc(material.views),
      );

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
          ...(includeReviewer
            ? {
                reviewedBy: {
                  id: users.id,
                  firstName: users.firstName,
                  lastName: users.lastName,
                  username: users.username,
                },
              }
            : {}),
        })
        .from(material)
        .leftJoin(users, eq(material.creatorId, users.id))
        .leftJoin(courses, eq(material.targetCourseId, courses.id))
        .where(whereCondition)
        .orderBy(...orderByClause)
        .limit(limit)
        .offset(offset)
        .execute();

      return {
        items: data,
        pagination: {
          total: totalItems,
          page,
          pageSize: limit,
          totalPages,
        },
        usedAdvanced,
      };
    }
  }

  async getRecommendations(
    user: UserEntity,
    page: number = 1,
  ): Promise<{
    items: Partial<MaterialEntity>[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    const limit = 20; // Increased page size to 20
    const offset = (page - 1) * limit;

    // Get department level courses (priority) - courses in user's department
    const departmentCourseIds = user.departmentId
      ? await this.db
          .select({ courseId: dlc.courseId })
          .from(dlc)
          .where(eq(dlc.departmentId, user.departmentId))
          .execute()
      : [];

    const deptCourseIds = departmentCourseIds.map((row) => row.courseId);

    // Get user's enrolled course IDs
    const userCourseIds = await this.db
      .select({ courseId: uc.courseId })
      .from(uc)
      .where(eq(uc.userId, user.id))
      .execute();

    const enrolledCourseIds = userCourseIds.map((row) => row.courseId);

    // Combine all course IDs (department courses have priority but we include both)
    const allCourseIds = [...new Set([...deptCourseIds, ...enrolledCourseIds])];

    // Get last 15 recent searches (most recent first)
    const recentSearches = await this.db
      .select({ query: searchHistory.query })
      .from(searchHistory)
      .where(eq(searchHistory.userId, user.id))
      .orderBy(desc(searchHistory.createdAt))
      .limit(15)
      .execute();

    // Get 5 random older searches (if there are more than 15 total)
    let olderSearches: { query: string }[] = [];
    const totalSearchCount = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(searchHistory)
      .where(eq(searchHistory.userId, user.id))
      .execute();

    const totalSearches = Number(totalSearchCount[0]?.count || 0);
    if (totalSearches > 15) {
      // Get random 5 from older searches (skip first 15, use SQL random ordering)
      // Get IDs of the first 15 most recent searches to exclude them
      const recentSearchIds = await this.db
        .select({ id: searchHistory.id })
        .from(searchHistory)
        .where(eq(searchHistory.userId, user.id))
        .orderBy(desc(searchHistory.createdAt))
        .limit(15)
        .execute();

      const recentIds = recentSearchIds.map((row) => row.id);

      if (recentIds.length > 0) {
        olderSearches = await this.db
          .select({ query: searchHistory.query })
          .from(searchHistory)
          .where(
            and(
              eq(searchHistory.userId, user.id),
              notInArray(searchHistory.id, recentIds),
            ),
          )
          .orderBy(sql`RANDOM()`)
          .limit(5)
          .execute();
      }
    }

    // Combine all search queries
    const allSearchQueries = [
      ...recentSearches.map((row) => row.query.trim()),
      ...olderSearches.map((row) => row.query.trim()),
    ].filter(Boolean);

    // Build recommendation conditions: course-based OR search-history-based
    const recommendationConditions = [];

    // Course-based recommendations (priority)
    if (allCourseIds.length > 0) {
      recommendationConditions.push(
        inArray(material.targetCourseId, allCourseIds),
      );
    }

    // Search history-based recommendations (for variation)
    if (allSearchQueries.length > 0) {
      const searchConditions = allSearchQueries.map((query) => {
        const queryLower = query.toLowerCase();
        return or(
          ilike(material.label, `%${query}%`),
          ilike(material.description, `%${query}%`),
          sql`${queryLower} ILIKE ANY(${material.tags})`,
          sql`EXISTS (
            SELECT 1 FROM ${courses} 
            WHERE ${courses.id} = ${material.targetCourseId} 
            AND (
              LOWER(${courses.courseName}) LIKE ${`%${queryLower}%`} OR 
              LOWER(${courses.courseCode}) LIKE ${`%${queryLower}%`} OR
              LOWER(${courses.description}) LIKE ${`%${queryLower}%`}
            )
          )`,
        );
      });
      recommendationConditions.push(or(...searchConditions));
    }

    // If no conditions, return empty result
    if (recommendationConditions.length === 0) {
      return {
        items: [],
        pagination: {
          total: 0,
          page,
          pageSize: limit,
          totalPages: 0,
        },
      };
    }

    const whereCondition = or(...recommendationConditions);

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(material)
      .where(whereCondition)
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch recommendations with ranking that prioritizes department level courses
    // Use raw SQL for better control over ranking
    let { searchVector, ...rest } = getTableColumns(material);

    // Build ranking using course IDs we already fetched
    // Use proper parameterized SQL for type safety
    const deptCourseCondition =
      deptCourseIds.length > 0
        ? sql`${material.targetCourseId} = ANY(${sql.raw(`ARRAY[${deptCourseIds.map((id) => `'${id}'::uuid`).join(',')}]`)}::uuid[])`
        : sql`FALSE`;

    const enrolledCourseCondition =
      enrolledCourseIds.length > 0
        ? sql`${material.targetCourseId} = ANY(${sql.raw(`ARRAY[${enrolledCourseIds.map((id) => `'${id}'::uuid`).join(',')}]`)}::uuid[])`
        : sql`FALSE`;

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
        // Ranking: Department courses get highest priority, then enrolled courses, then search history matches
        rank: sql<number>`
          CASE 
            -- Highest priority: Department level courses (if user has department and course matches)
            WHEN ${deptCourseCondition} THEN 100
            -- Second priority: User's enrolled courses
            WHEN ${enrolledCourseCondition} THEN 50
            -- Lower priority: Search history matches (variation)
            ELSE 10
          END
          + ${material.likes} * 0.1
          + ${material.downloads} * 0.05
          + ${material.views} * 0.01 AS rank`,
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
      items: data,
      pagination: {
        total: totalItems,
        page,
        pageSize: limit,
        totalPages,
      },
    };
  }

  async getPopularMaterials(limit: number = 10) {
    // Weight: saves (bookmarks) 4x, likes 3x, downloads 2x, views 1x
    const savesCount = sql<number>`(
      SELECT COUNT(*)::int FROM ${bookmarks}
      WHERE ${bookmarks.materialId} = ${material.id}
    )`;

    const score = sql<number>`(
      4 * (${savesCount}) + 3 * ${material.likes} + 2 * ${material.downloads} + 1 * ${material.views}
    )`;

    const data = await this.db
      .select({
        ...getTableColumns(material),
        saves: savesCount,
        popularityScore: score,
        creator: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          username: users.username,
        },
        targetCourse: {
          id: courses.id,
          courseName: courses.courseName,
          courseCode: courses.courseCode,
        },
      })
      .from(material)
      .leftJoin(users, eq(material.creatorId, users.id))
      .leftJoin(courses, eq(material.targetCourseId, courses.id))
      .where(eq(material.reviewStatus, ApprovalStatus.APPROVED))
      .orderBy(desc(score), desc(material.createdAt))
      .limit(limit)
      .execute();

    return data;
  }

  /**
   * Get general recommendations for users without department - based on recent and engaging materials
   * Scoring: saves (4x) + likes (3x) + downloads (2x) + views (1x) + recency bonus
   * Recency bonus: 20 points (last 7 days), 10 points (last 30 days), 5 points (last 90 days)
   */
  async getGeneralRecommendations(
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    items: Partial<MaterialEntity>[];
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * limit;

    // Calculate engagement score: saves (bookmarks) 4x, likes 3x, downloads 2x, views 1x
    const savesCount = sql<number>`(
      SELECT COUNT(*)::int FROM ${bookmarks}
      WHERE ${bookmarks.materialId} = ${material.id}
    )`;

    const engagementScore = sql<number>`(
      4 * (${savesCount}) + 3 * ${material.likes} + 2 * ${material.downloads} + 1 * ${material.views}
    )`;

    // Add recency bonus - materials from last 30 days get bonus points
    const recencyBonus = sql<number>`
      CASE 
        WHEN ${material.createdAt} > NOW() - INTERVAL '7 days' THEN 20
        WHEN ${material.createdAt} > NOW() - INTERVAL '30 days' THEN 10
        WHEN ${material.createdAt} > NOW() - INTERVAL '90 days' THEN 5
        ELSE 0
      END
    `;

    // Get total count for pagination
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(material)
      .where(eq(material.reviewStatus, ApprovalStatus.APPROVED))
      .execute();

    const totalItems = Number(countResult[0]?.count || 0);
    const totalPages = Math.ceil(totalItems / limit);

    // Fetch recommendations with engagement + recency scoring
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
        rank: sql<number>`(${engagementScore} + ${recencyBonus}) AS rank`,
      })
      .from(material)
      .leftJoin(users, eq(material.creatorId, users.id))
      .leftJoin(courses, eq(material.targetCourseId, courses.id))
      .where(eq(material.reviewStatus, ApprovalStatus.APPROVED))
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
      items: data,
      pagination: {
        total: totalItems,
        page,
        pageSize: limit,
        totalPages,
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
                SELECT ${departmentLevelCourses.courseId}
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

  async trackRecentView(userId: string, materialId: string): Promise<void> {
    // First, cleanup old entries if user has more than MAX_RECENT_ENTRIES_PER_USER
    await this.cleanupOldRecentEntries(userId);

    // Use upsert pattern to insert or update the lastViewedAt timestamp
    await this.db
      .insert(recent)
      .values({
        userId,
        materialId,
        lastViewedAt: new Date(), // Explicitly set to current time
      } as any)
      .onConflictDoUpdate({
        target: [recent.userId, recent.materialId],
        set: {
          lastViewedAt: new Date(), // Update to current time on conflict
        } as any,
      })
      .execute();
  }

  // Cleanup old recent entries to maintain only MAX_RECENT_ENTRIES_PER_USER per user
  private async cleanupOldRecentEntries(userId: string): Promise<void> {
    // Count current entries for user
    const countResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(recent)
      .where(eq(recent.userId, userId))
      .execute();

    const currentCount = Number(countResult[0]?.count || 0);

    // If count exceeds or equals max, delete oldest entries
    if (currentCount >= MAX_RECENT_ENTRIES_PER_USER) {
      // Get IDs of entries to keep (most recent ones)
      const entriesToKeep = await this.db
        .select({ id: recent.id })
        .from(recent)
        .where(eq(recent.userId, userId))
        .orderBy(desc(recent.lastViewedAt))
        .limit(MAX_RECENT_ENTRIES_PER_USER - 1) // Keep one less to make room for new entry
        .execute();

      const idsToKeep = entriesToKeep.map((entry) => entry.id);

      // Delete all entries not in the keep list
      if (idsToKeep.length > 0) {
        await this.db
          .delete(recent)
          .where(
            and(
              eq(recent.userId, userId),
              sql`${recent.id} NOT IN (${sql.join(
                idsToKeep.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            ),
          )
          .execute();
      } else {
        // If no entries to keep, delete all
        await this.db.delete(recent).where(eq(recent.userId, userId)).execute();
      }
    }
  }

  async getRecentMaterials(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ items: MaterialEntity[]; total: number }> {
    const offset = (page - 1) * limit;

    // Get total count
    const totalResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(recent)
      .where(eq(recent.userId, userId))
      .execute();

    const total = Number(totalResult[0]?.count || 0);

    // Get recent materials with full material data
    const recentMaterials = await this.db
      .select({
        ...getTableColumns(material),
        lastViewedAt: recent.lastViewedAt,
      })
      .from(recent)
      .innerJoin(material, eq(recent.materialId, material.id))
      .where(eq(recent.userId, userId))
      .orderBy(desc(recent.lastViewedAt))
      .limit(limit)
      .offset(offset)
      .execute();

    return {
      items: recentMaterials as MaterialEntity[],
      total,
    };
  }

  // Optimized batch find by IDs - single query with joins
  async findManyByIds(materialIds: string[]): Promise<any[]> {
    if (materialIds.length === 0) {
      return [];
    }

    return this.db.query.material.findMany({
      where: inArray(material.id, materialIds),
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
        targetCourse: {
          columns: {
            id: true,
            courseName: true,
            courseCode: true,
          },
        },
        resource: true,
        adverts: true,
        folders: {
          with: {
            folder: {
              with: {
                creator: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
                content: true,
              },
            },
          },
        },
      },
      columns: {
        searchVector: false, // Exclude search vector from results
      },
    });
  }

  // Batch increment views for multiple materials
  async batchIncrementViews(materialIds: string[]): Promise<void> {
    if (materialIds.length === 0) {
      return;
    }

    await this.db
      .update(material)
      .set({
        views: sql`${material.views} + 1`,
      } as any)
      .where(inArray(material.id, materialIds));
  }

  // Batch track recent views for a user
  async batchTrackRecentViews(
    userId: string,
    materialIds: string[],
  ): Promise<void> {
    if (materialIds.length === 0) {
      return;
    }

    // First, cleanup old entries
    await this.cleanupOldRecentEntries(userId);

    // Delete existing records first
    await this.db
      .delete(recent)
      .where(
        and(eq(recent.userId, userId), inArray(recent.materialId, materialIds)),
      );

    // Insert new records with lastViewedAt timestamp
    const recentRecords = materialIds.map((materialId) => ({
      userId,
      materialId,
      lastViewedAt: new Date(),
    }));

    await this.db.insert(recent).values(recentRecords);
  }

  // ============= READING PROGRESS METHODS =============

  /**
   * Save or update reading progress for a user on a material
   */
  async saveReadingProgress(
    userId: string,
    materialId: string,
    progressData: SaveReadingProgressDto,
  ) {
    const now = new Date();
    const dataToSave = {
      userId,
      materialId,
      ...progressData,
      lastProgressUpdate: now,
      ...(progressData.isCompleted && { completedAt: now }),
      updatedAt: now,
    };

    // Use INSERT ... ON CONFLICT to upsert
    const result = await this.db
      .insert(readingProgress)
      .values(dataToSave as any)
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.materialId],
        set: {
          ...progressData,
          lastProgressUpdate: now,
          updatedAt: now,
          ...(progressData.isCompleted && { completedAt: now }),
        } as any,
      })
      .returning();

    return result[0];
  }

  /**
   * Get reading progress for a specific material and user
   */
  async getReadingProgress(userId: string, materialId: string) {
    return this.db.query.readingProgress.findFirst({
      where: and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.materialId, materialId),
      ),
    });
  }

  /**
   * Delete reading progress (reset progress)
   */
  async deleteReadingProgress(userId: string, materialId: string) {
    const result = await this.db
      .delete(readingProgress)
      .where(
        and(
          eq(readingProgress.userId, userId),
          eq(readingProgress.materialId, materialId),
        ),
      )
      .returning();

    return result[0];
  }

  /**
   * Get all materials with reading progress for a user (for "Continue Reading" feature)
   */
  async getMaterialsWithProgress(
    userId: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    return this.db.query.readingProgress.findMany({
      where: and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.isCompleted, false),
      ),
      with: {
        material: {
          with: {
            creator: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
                profilePicture: true,
              },
            },
            targetCourse: true,
            resource: true,
          },
        },
      },
      orderBy: [desc(readingProgress.lastProgressUpdate)],
      limit,
      offset,
    });
  }

  /**
   * Get reading progress stats for a user
   */
  async getReadingStats(userId: string) {
    const stats = await this.db
      .select({
        totalMaterials: sql<number>`count(*)`,
        completedMaterials: sql<number>`count(*) filter (where ${readingProgress.isCompleted} = true)`,
        totalReadingTime: sql<number>`sum(${readingProgress.totalReadingTime})`,
        avgProgress: sql<number>`avg(${readingProgress.progressPercentage})`,
      })
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId));

    return stats[0];
  }
}
