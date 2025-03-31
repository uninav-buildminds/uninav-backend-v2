import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { CollectionEntity, DrizzleDB } from 'src/utils/types/db.types';
import { and, eq } from 'drizzle-orm';
import {
  collection,
  collectionMaterial,
} from 'src/modules/drizzle/schema/collection.schema';
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

  async findAll(): Promise<CollectionEntity[]> {
    return this.db.query.collection.findMany({
      with: {
        creator: true,
        materials: {
          with: {
            material: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<CollectionEntity | null> {
    return this.db.query.collection.findFirst({
      where: eq(collection.id, id),
      with: {
        creator: true,
        materials: {
          with: {
            material: {
              with: {
                resource: true,
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
        materials: {
          with: {
            material: true,
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
  async addMaterial(collectionId: string, dto: AddMaterialToCollectionDto) {
    const result = await this.db
      .insert(collectionMaterial)
      .values({
        collectionId,
        materialId: dto.materialId,
      })
      .returning();
    return result[0];
  }

  async removeMaterial(collectionId: string, materialId: string) {
    const result = await this.db
      .delete(collectionMaterial)
      .where(
        and(
          eq(collectionMaterial.collectionId, collectionId),
          eq(collectionMaterial.materialId, materialId),
        ),
      )
      .returning();
    return result[0];
  }
}
