import { pgTable, uuid, text, numeric, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { advertTypeEnum, approvalStatusEnum } from './enums.schema';
import { material } from './material.schema';
import { folder } from './folder.schema';
import { timestamps } from '@app/common/modules/database/schema/timestamps';
import { TABLES } from '../tables.constants';
import { users } from './user.schema';

export const advert = pgTable(TABLES.ADVERT, {
  id: uuid('id').primaryKey().defaultRandom(),
  type: advertTypeEnum('type').notNull(),
  amount: numeric('amount').default('0'),
  creatorId: uuid('creator_id')
    .references(() => users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  materialId: uuid('material_id').references(() => material.id, {
    onDelete: 'cascade',
  }),
  folderId: uuid('folder_id').references(() => folder.id, {
    onDelete: 'cascade',
  }),
  imageUrl: text('image_url').notNull(),
  fileKey: text('file_key').notNull(),
  label: text('label').notNull(),
  description: text('description'),
  clicks: integer('clicks').default(0),
  views: integer('views').default(0),
  reviewStatus: approvalStatusEnum('review_status').default('pending'),
  reviewedById: uuid('reviewed_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
});

export const advertRelations = relations(advert, ({ one }) => ({
  material: one(material, {
    fields: [advert.materialId],
    references: [material.id],
  }),
  folder: one(folder, {
    fields: [advert.folderId],
    references: [folder.id],
  }),
  creator: one(users, {
    fields: [advert.creatorId],
    references: [users.id],
    relationName: 'advert_creator',
  }),
  reviewedBy: one(users, {
    fields: [advert.reviewedById],
    references: [users.id],
    relationName: 'advert_reviewer',
  }),
}));
