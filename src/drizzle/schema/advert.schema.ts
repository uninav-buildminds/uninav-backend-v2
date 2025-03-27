import {
  pgTable,
  uuid,
  text,
  numeric,
  integer,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { advertStatusEnum, advertTypeEnum } from './enums.schema';
import { material } from './material.schema';
import { collection } from './collection.schema';

export const advert = pgTable('advert', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: advertTypeEnum('type').notNull(),
  amount: numeric('amount'),
  materialId: uuid('material_id').references(() => material.id, {
    onDelete: 'cascade',
  }),
  collectionId: uuid('collection_id').references(() => collection.id, {
    onDelete: 'cascade',
  }),
  imageUrl: text('image_url'),
  label: text('label'),
  description: text('description'),
  clicks: integer('clicks').default(0),
  impressions: integer('impressions').default(0),
  status: advertStatusEnum('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const advertRelations = relations(advert, ({ one }) => ({
  material: one(material, {
    fields: [advert.materialId],
    references: [material.id],
  }),
  collection: one(collection, {
    fields: [advert.collectionId],
    references: [collection.id],
  }),
}));
