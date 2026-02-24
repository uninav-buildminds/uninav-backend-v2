import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { FolderEntity, DrizzleDB } from '@app/common/types/db.types';
import { and, eq, sql, desc, or, isNull, inArray } from 'drizzle-orm';
import {
  folder,
  folderContent,
} from '@app/common/modules/database/schema/folder.schema';
import { users } from '@app/common/modules/database/schema/user.schema';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { AddMaterialToFolderDto } from './dto/add-material.dto';

@Injectable()
export class FolderRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(createFolderDto: CreateFolderDto): Promise<FolderEntity> {
    const result = await this.db
      .insert(folder)
      .values(createFolderDto)
      .returning();
    return result[0];
  }

  /** List folders with materialCount/nestedFolderCount from SQL (no content), optional limit/offset */
  private async findFoldersWithCountsAndCreator(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<(FolderEntity & { materialCount: number; nestedFolderCount: number })[]> {
    const countSubquery = this.db
      .select({
        folderId: folderContent.folderId,
        materialCount: sql<number>`count(*) filter (where ${folderContent.contentMaterialId} is not null)`.as(
          'materialCount',
        ),
        nestedFolderCount: sql<number>`count(*) filter (where ${folderContent.contentFolderId} is not null)`.as(
          'nestedFolderCount',
        ),
      })
      .from(folderContent)
      .groupBy(folderContent.folderId)
      .as('counts');

    let query = this.db
      .select({
        id: folder.id,
        creatorId: folder.creatorId,
        label: folder.label,
        description: folder.description,
        visibility: folder.visibility,
        targetCourseId: folder.targetCourseId,
        likes: folder.likes,
        views: folder.views,
        lastViewedAt: folder.lastViewedAt,
        deletedAt: folder.deletedAt,
        slug: folder.slug,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        materialCount: countSubquery.materialCount,
        nestedFolderCount: countSubquery.nestedFolderCount,
        creatorIdUser: users.id,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorUsername: users.username,
      })
      .from(folder)
      .leftJoin(countSubquery, eq(folder.id, countSubquery.folderId))
      .leftJoin(users, eq(folder.creatorId, users.id))
      .where(eq(folder.creatorId, userId))
      .orderBy(desc(folder.lastViewedAt), desc(folder.createdAt));

    if (limit != null) query = query.limit(limit) as typeof query;
    if (offset != null) query = query.offset(offset) as typeof query;

    const rows = await query;

    return rows.map((row) => {
      const { creatorIdUser, creatorFirstName, creatorLastName, creatorUsername, ...rest } =
        row;
      return {
        ...rest,
        materialCount: Number(rest.materialCount ?? 0),
        nestedFolderCount: Number(rest.nestedFolderCount ?? 0),
        creator: creatorIdUser
          ? {
              id: creatorIdUser,
              firstName: creatorFirstName,
              lastName: creatorLastName,
              username: creatorUsername,
            }
          : undefined,
      } as FolderEntity & { materialCount: number; nestedFolderCount: number };
    });
  }

  async findAll(userId: string): Promise<FolderEntity[]> {
    return this.findFoldersWithCountsAndCreator(userId, undefined, undefined);
  }

  /** Material IDs that appear in any folder owned by the user (for list UIs) */
  async getMaterialIdsInUserFolders(userId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ materialId: folderContent.contentMaterialId })
      .from(folderContent)
      .innerJoin(folder, eq(folderContent.folderId, folder.id))
      .where(
        and(
          eq(folder.creatorId, userId),
          sql`${folderContent.contentMaterialId} IS NOT NULL`,
        ),
      );
    return rows.map((r) => r.materialId).filter((id): id is string => !!id);
  }

  async findAllPaginated(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<FolderEntity[]> {
    return this.findFoldersWithCountsAndCreator(userId, limit, offset);
  }

  async findOne(id: string): Promise<FolderEntity | null> {
    const found = await this.db.query.folder.findFirst({
      where: eq(folder.id, id),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        content: {
          with: {
            material: {
              with: {
                creator: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
            nestedFolder: {
              with: {
                creator: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!found) {
      return found;
    }

    // Compute stats for this folder
    const materialCount =
      found.content?.filter((c) => c.contentMaterialId !== null).length || 0;
    const nestedFolderCount =
      found.content?.filter((c) => c.contentFolderId !== null).length || 0;

    // Compute one-level-down material counts for nested folders in a single query
    const childFolderIds =
      found.content
        ?.map((c) => c.contentFolderId)
        .filter((id): id is string => !!id) || [];

    if (childFolderIds.length > 0) {
      const childCounts = await this.db
        .select({
          folderId: folderContent.folderId,
          count: sql<number>`count(*)`,
        })
        .from(folderContent)
        .where(
          and(
            inArray(folderContent.folderId, childFolderIds),
            sql`${folderContent.contentMaterialId} IS NOT NULL`,
          ),
        )
        .groupBy(folderContent.folderId);

      const countsMap = new Map<string, number>(
        childCounts.map((row) => [row.folderId, Number(row.count)]),
      );

      // Attach materialCount to each nested folder entity
      found.content?.forEach((c) => {
        if (c.contentFolderId && c.nestedFolder) {
          (c.nestedFolder as any).materialCount =
            countsMap.get(c.contentFolderId) || 0;
        }
      });
    }

    return {
      ...found,
      materialCount,
      nestedFolderCount,
    } as FolderEntity & {
      materialCount: number;
      nestedFolderCount: number;
    };
  }

  async findBySlug(slug: string): Promise<FolderEntity | null> {
    const found = await this.db.query.folder.findFirst({
      where: eq(folder.slug, slug),
      with: {
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        content: {
          with: {
            material: {
              with: {
                creator: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
            nestedFolder: {
              with: {
                creator: {
                  columns: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!found) {
      return found;
    }

    const materialCount =
      found.content?.filter((c) => c.contentMaterialId !== null).length || 0;
    const nestedFolderCount =
      found.content?.filter((c) => c.contentFolderId !== null).length || 0;

    const childFolderIds =
      found.content
        ?.map((c) => c.contentFolderId)
        .filter((id): id is string => !!id) || [];

    if (childFolderIds.length > 0) {
      const childCounts = await this.db
        .select({
          folderId: folderContent.folderId,
          count: sql<number>`count(*)`,
        })
        .from(folderContent)
        .where(
          and(
            inArray(folderContent.folderId, childFolderIds),
            sql`${folderContent.contentMaterialId} IS NOT NULL`,
          ),
        )
        .groupBy(folderContent.folderId);

      const countsMap = new Map<string, number>(
        childCounts.map((row) => [row.folderId, Number(row.count)]),
      );

      found.content?.forEach((c) => {
        if (c.contentFolderId && c.nestedFolder) {
          (c.nestedFolder as any).materialCount =
            countsMap.get(c.contentFolderId) || 0;
        }
      });
    }

    return {
      ...found,
      materialCount,
      nestedFolderCount,
    } as FolderEntity & {
      materialCount: number;
      nestedFolderCount: number;
    };
  }

  async findByCreator(creatorId: string): Promise<FolderEntity[]> {
    return this.db.query.folder.findMany({
      where: eq(folder.creatorId, creatorId),
      with: {
        content: {
          with: {
            material: true,
            nestedFolder: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateFolderDto: UpdateFolderDto,
  ): Promise<FolderEntity> {
    const result = await this.db
      .update(folder)
      .set(updateFolderDto)
      .where(eq(folder.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string): Promise<FolderEntity> {
    const result = await this.db
      .delete(folder)
      .where(eq(folder.id, id))
      .returning();
    return result[0];
  }

  // Material relationship operations
  async findContentByMaterial(folderId: string, materialId: string) {
    return this.db.query.folderContent.findFirst({
      where: and(
        eq(folderContent.folderId, folderId),
        eq(folderContent.contentMaterialId, materialId),
      ),
    });
  }

  async addMaterial(folderId: string, dto: AddMaterialToFolderDto) {
    const result = await this.db
      .insert(folderContent)
      .values({
        folderId,
        contentMaterialId: dto.materialId,
      })
      .returning();
    return result[0];
  }

  async removeMaterial(folderId: string, materialId: string) {
    const result = await this.db
      .delete(folderContent)
      .where(
        and(
          eq(folderContent.folderId, folderId),
          eq(folderContent.contentMaterialId, materialId),
        ),
      )
      .returning();
    return result[0];
  }

  // Nested folder operations
  async findNestedFolder(parentId: string, childId: string) {
    return this.db.query.folderContent.findFirst({
      where: and(
        eq(folderContent.folderId, parentId),
        eq(folderContent.contentFolderId, childId),
      ),
    });
  }

  async addNestedFolder(parentId: string, childId: string) {
    const result = await this.db
      .insert(folderContent)
      .values({
        folderId: parentId,
        contentFolderId: childId,
      })
      .returning();
    return result[0];
  }

  async removeNestedFolder(parentId: string, childId: string) {
    const result = await this.db
      .delete(folderContent)
      .where(
        and(
          eq(folderContent.folderId, parentId),
          eq(folderContent.contentFolderId, childId),
        ),
      )
      .returning();
    return result[0];
  }

  async getAllNestedFolders(folderId: string): Promise<FolderEntity[]> {
    // Get all nested folders recursively
    const nestedFolders = await this.db.query.folderContent.findMany({
      where: eq(folderContent.folderId, folderId),
      with: {
        nestedFolder: true,
      },
    });

    // Extract just the folder entities and flatten the array
    const folders = nestedFolders
      .map((content) => content.nestedFolder)
      .filter(Boolean);

    // For each nested folder, get its nested folders
    const childFolders = await Promise.all(
      folders.map((folder) => this.getAllNestedFolders(folder.id)),
    );

    // Combine all folders into a single array
    return [...folders, ...childFolders.flat()];
  }

  async getFolderStats(folderId: string) {
    const stats = await this.db.transaction(async (tx) => {
      const materialCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(folderContent)
        .where(
          and(
            eq(folderContent.folderId, folderId),
            sql`${folderContent.contentMaterialId} IS NOT NULL`,
          ),
        );

      const nestedFolderCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(folderContent)
        .where(
          and(
            eq(folderContent.folderId, folderId),
            sql`${folderContent.contentFolderId} IS NOT NULL`,
          ),
        );

      return {
        materialCount: Number(materialCount[0]?.count || 0),
        nestedFolderCount: Number(nestedFolderCount[0]?.count || 0),
      };
    });

    return stats;
  }

  // Track folder view by updating lastViewedAt timestamp
  async trackFolderView(folderId: string): Promise<void> {
    await this.db
      .update(folder)
      .set({
        lastViewedAt: sql`NOW()`,
      } as any)
      .where(eq(folder.id, folderId))
      .execute();
  }

  // Search folders by label or description; returns counts from SQL, no content
  async searchFolders(
    searchQuery: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<(FolderEntity & { materialCount: number; nestedFolderCount: number })[]> {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const pattern = `%${normalizedQuery}%`;

    const countSubquery = this.db
      .select({
        folderId: folderContent.folderId,
        materialCount: sql<number>`count(*) filter (where ${folderContent.contentMaterialId} is not null)`.as(
          'materialCount',
        ),
        nestedFolderCount: sql<number>`count(*) filter (where ${folderContent.contentFolderId} is not null)`.as(
          'nestedFolderCount',
        ),
      })
      .from(folderContent)
      .groupBy(folderContent.folderId)
      .as('counts');

    const rows = await this.db
      .select({
        id: folder.id,
        creatorId: folder.creatorId,
        label: folder.label,
        description: folder.description,
        visibility: folder.visibility,
        targetCourseId: folder.targetCourseId,
        likes: folder.likes,
        views: folder.views,
        lastViewedAt: folder.lastViewedAt,
        deletedAt: folder.deletedAt,
        slug: folder.slug,
        createdAt: folder.createdAt,
        updatedAt: folder.updatedAt,
        materialCount: countSubquery.materialCount,
        nestedFolderCount: countSubquery.nestedFolderCount,
        creatorIdUser: users.id,
        creatorFirstName: users.firstName,
        creatorLastName: users.lastName,
        creatorUsername: users.username,
      })
      .from(folder)
      .leftJoin(countSubquery, eq(folder.id, countSubquery.folderId))
      .leftJoin(users, eq(folder.creatorId, users.id))
      .where(
        or(
          sql`LOWER(${folder.label}) LIKE ${pattern}`,
          sql`LOWER(${folder.description}) LIKE ${pattern}`,
        ),
      )
      .orderBy(desc(folder.likes), desc(folder.views), desc(folder.createdAt))
      .limit(limit)
      .offset(offset);

    return rows.map((row) => {
      const { creatorIdUser, creatorFirstName, creatorLastName, creatorUsername, ...rest } =
        row;
      return {
        ...rest,
        materialCount: Number(rest.materialCount ?? 0),
        nestedFolderCount: Number(rest.nestedFolderCount ?? 0),
        creator: creatorIdUser
          ? {
              id: creatorIdUser,
              firstName: creatorFirstName,
              lastName: creatorLastName,
              username: creatorUsername,
            }
          : undefined,
      } as FolderEntity & { materialCount: number; nestedFolderCount: number };
    });
  }

  // Find folders containing a specific material
  async findFoldersByMaterial(materialId: string): Promise<FolderEntity[]> {
    const folderContents = await this.db.query.folderContent.findMany({
      where: eq(folderContent.contentMaterialId, materialId),
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
            content: {
              with: {
                material: {
                  with: {
                    creator: {
                      columns: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        username: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return folderContents.map((fc) => fc.folder).filter(Boolean);
  }
}
