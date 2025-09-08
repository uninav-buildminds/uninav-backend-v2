import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { CollectionEntity, DrizzleDB } from '@app/common/types/db.types';
import { and, eq, sql } from 'drizzle-orm';
import {
  collection,
  collectionContent,
} from '@app/common/modules/database/schema/collection.schema';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { AddMaterialToCollectionDto } from './dto/add-material.dto';

@Injectable()
export class CollectionRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(
    createCollectionDto: CreateCollectionDto,
  ): Promise<CollectionEntity> {
    const result = await this.db
      .insert(collection)
      .values(createCollectionDto)
      .returning();
    return result[0];
  }

  async findAll(userId: string): Promise<CollectionEntity[]> {
    return this.db.query.collection.findMany({
      where: eq(collection.creatorId, userId),
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
    });
  }

  async findOne(id: string): Promise<CollectionEntity | null> {
    return this.db.query.collection.findFirst({
      where: eq(collection.id, id),
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
            nestedCollection: {
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

  async findByCreator(creatorId: string): Promise<CollectionEntity[]> {
    return this.db.query.collection.findMany({
      where: eq(collection.creatorId, creatorId),
      with: {
        content: {
          with: {
            material: true,
            nestedCollection: true,
          },
        },
      },
    });
  }

  async update(
    id: string,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<CollectionEntity> {
    const result = await this.db
      .update(collection)
      .set(updateCollectionDto)
      .where(eq(collection.id, id))
      .returning();
    return result[0];
  }

  async remove(id: string): Promise<CollectionEntity> {
    const result = await this.db
      .delete(collection)
      .where(eq(collection.id, id))
      .returning();
    return result[0];
  }

  // Material relationship operations
  async findContentByMaterial(collectionId: string, materialId: string) {
    return this.db.query.collectionContent.findFirst({
      where: and(
        eq(collectionContent.collectionId, collectionId),
        eq(collectionContent.contentMaterialId, materialId),
      ),
    });
  }

  async addMaterial(collectionId: string, dto: AddMaterialToCollectionDto) {
    const result = await this.db
      .insert(collectionContent)
      .values({
        collectionId,
        contentMaterialId: dto.materialId,
      })
      .returning();
    return result[0];
  }

  async removeMaterial(collectionId: string, materialId: string) {
    const result = await this.db
      .delete(collectionContent)
      .where(
        and(
          eq(collectionContent.collectionId, collectionId),
          eq(collectionContent.contentMaterialId, materialId),
        ),
      )
      .returning();
    return result[0];
  }

  // Nested collection operations
  async findNestedCollection(parentId: string, childId: string) {
    return this.db.query.collectionContent.findFirst({
      where: and(
        eq(collectionContent.collectionId, parentId),
        eq(collectionContent.contentCollectionId, childId),
      ),
    });
  }

  async addNestedCollection(parentId: string, childId: string) {
    const result = await this.db
      .insert(collectionContent)
      .values({
        collectionId: parentId,
        contentCollectionId: childId,
      })
      .returning();
    return result[0];
  }

  async removeNestedCollection(parentId: string, childId: string) {
    const result = await this.db
      .delete(collectionContent)
      .where(
        and(
          eq(collectionContent.collectionId, parentId),
          eq(collectionContent.contentCollectionId, childId),
        ),
      )
      .returning();
    return result[0];
  }

  async getAllNestedCollections(
    collectionId: string,
  ): Promise<CollectionEntity[]> {
    // Get all nested collections recursively
    const nestedCollections = await this.db.query.collectionContent.findMany({
      where: eq(collectionContent.collectionId, collectionId),
      with: {
        nestedCollection: true,
      },
    });

    // Extract just the collection entities and flatten the array
    const collections = nestedCollections
      .map((content) => content.nestedCollection)
      .filter(Boolean);

    // For each nested collection, get its nested collections
    const childCollections = await Promise.all(
      collections.map((collection) =>
        this.getAllNestedCollections(collection.id),
      ),
    );

    // Combine all collections into a single array
    return [...collections, ...childCollections.flat()];
  }

  async getCollectionStats(collectionId: string) {
    const stats = await this.db.transaction(async (tx) => {
      const materialCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(collectionContent)
        .where(
          and(
            eq(collectionContent.collectionId, collectionId),
            sql`${collectionContent.contentMaterialId} IS NOT NULL`,
          ),
        );

      const nestedCollectionCount = await tx
        .select({ count: sql<number>`count(*)` })
        .from(collectionContent)
        .where(
          and(
            eq(collectionContent.collectionId, collectionId),
            sql`${collectionContent.contentCollectionId} IS NOT NULL`,
          ),
        );

      return {
        materialCount: Number(materialCount[0]?.count || 0),
        nestedCollectionCount: Number(nestedCollectionCount[0]?.count || 0),
      };
    });

    return stats;
  }
}
