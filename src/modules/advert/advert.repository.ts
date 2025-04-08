import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_SYMBOL } from 'src/utils/config/constants.config';
import { DrizzleDB, AdvertEntity } from 'src/utils/types/db.types';
import { eq, sql } from 'drizzle-orm';
import { advert } from 'src/modules/drizzle/schema/advert.schema';
import { CreateFreeAdvertDto } from './dto/create-advert.dto';

@Injectable()
export class AdvertRepository {
  constructor(@Inject(DRIZZLE_SYMBOL) private readonly db: DrizzleDB) {}

  async create(
    createAdvertData: CreateFreeAdvertDto & {
      imageUrl: string;
      fileKey: string;
    },
  ): Promise<AdvertEntity> {
    const result = await this.db
      .insert(advert)
      .values(createAdvertData as any)
      .returning();
    return result[0];
  }

  async findAll(): Promise<AdvertEntity[]> {
    return this.db.query.advert.findMany({
      with: {
        material: true,
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async findOne(id: string): Promise<AdvertEntity> {
    return this.db.query.advert.findFirst({
      where: eq(advert.id, id),
      with: {
        material: true,
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async findByMaterial(materialId: string): Promise<AdvertEntity[]> {
    return this.db.query.advert.findMany({
      where: eq(advert.materialId, materialId),
      with: {
        material: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async findByCollection(collectionId: string): Promise<AdvertEntity[]> {
    return this.db.query.advert.findMany({
      where: eq(advert.collectionId, collectionId),
      with: {
        collection: true,
        creator: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });
  }

  async update(id: string, updateData: Partial<AdvertEntity>): Promise<void> {
    await this.db
      .update(advert)
      .set({ ...updateData, updatedAt: new Date() } as any)
      .where(eq(advert.id, id));
  }

  async incrementViews(id: string): Promise<void> {
    await this.db
      .update(advert)
      .set({
        views: sql`${advert.views} + 1`,
        updatedAt: new Date(),
      } as any)
      .where(eq(advert.id, id));
  }

  async incrementClicks(id: string): Promise<void> {
    await this.db
      .update(advert)
      .set({
        clicks: sql`${advert.clicks} + 1`,
        updatedAt: new Date(),
      } as any)
      .where(eq(advert.id, id));
  }

  async remove(id: string): Promise<AdvertEntity> {
    const result = await this.db
      .delete(advert)
      .where(eq(advert.id, id))
      .returning();
    return result[0];
  }
}
