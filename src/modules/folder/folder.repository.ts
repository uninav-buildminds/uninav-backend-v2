import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { FolderEntity, DrizzleDB } from '@app/common/types/db.types';
import { and, eq, sql, desc, or, isNull } from 'drizzle-orm';
import {
  folder,
  folderContent,
} from '@app/common/modules/database/schema/folder.schema';
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

  async findAll(userId: string): Promise<FolderEntity[]> {
    const folders = await this.db.query.folder.findMany({
      where: eq(folder.creatorId, userId),
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
      orderBy: (folder, { desc }) => [
        // Sort by lastViewedAt descending (most recently viewed first)
        // Folders without lastViewedAt go to the end
        desc(folder.lastViewedAt),
        desc(folder.createdAt), // Secondary sort by creation date
      ],
    });
    return folders;
  }

  async findOne(id: string): Promise<FolderEntity | null> {
    return this.db.query.folder.findFirst({
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
}
