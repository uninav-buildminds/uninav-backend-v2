import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import {
  DrizzleDB,
  MaterialEntity,
  MaterialTypeEnum,
} from 'src/utils/types/db.types';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { material } from 'src/modules/drizzle/schema/material.schema';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { resource } from 'src/modules/drizzle/schema/resource.schema';

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
      .values(createMaterialDto)
      .returning();
    return result[0];
  }

  async findAll(): Promise<MaterialEntity[]> {
    return this.db.query.material.findMany({
      with: {
        creator: true,
        resource: true,
      },
    });
  }

  async findOne(id: string) {
    return this.db.query.material.findFirst({
      where: eq(material.id, id),
      with: {
        creator: true,
        resource: true,
      },
    });
  }

  async incrementDownloadCount(id: string): Promise<MaterialEntity> {
    const result = await this.db
      .update(material)
      .set({
        downloadCount: sql`${material.downloadCount} + 1`,
      } as any)
      .where(eq(material.id, id))
      .returning();
    return result[0];
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
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<MaterialEntity> {
    const result = await this.db
      .update(material)
      .set(updateMaterialDto)
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

  // Resource related operations
  async createResource(resourceData: {
    materialId: string;
    resourceAddress: string;
    resourceType: string;
    metaData?: string[];
  }) {
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
      .set(resourceData)
      .where(eq(resource.materialId, materialId))
      .returning();
    return result[0];
  }

  async findByCreator(creatorId: string): Promise<MaterialEntity[]> {
    return this.db.query.material.findMany({
      where: eq(material.creatorId, creatorId),
      with: {
        resource: true,
      },
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
}
