import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  check,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  materialStatusEnum,
  visibilityEnum,
  restrictionEnum,
} from './enums.schema';
import { user } from './user.schema';
import { moderator } from './moderator.schema';
import { collectionMaterial } from './collection.schema';
import { advert } from './advert.schema';

export const material = pgTable('material', {
  id: uuid('id').primaryKey().defaultRandom(),
  // type url, file, video, audio, image
  type: text('type'),
  url: text('url'),
  schemeOfWork: text('scheme_of_work'),
  resourceAddress: text('resourceAddress'),
  langs: text('langs').array(),
  downloadCount: integer('download_count').default(0),
  likes: integer('likes').default(0),
  creatorId: uuid('creator').references(() => user.id, {
    onDelete: 'set null',
  }),
  label: text('label'),
  description: text('description'),
  status: materialStatusEnum('status').default('pending'),
  visibility: visibilityEnum('visibility').default('public'),
  restriction: restrictionEnum('restriction').default('readonly'),
  reviewedBy: uuid('reviewedBy').references(() => moderator.userId, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const materialRelations = relations(material, ({ one, many }) => ({
  creator: one(user, {
    fields: [material.creatorId],
    references: [user.id],
  }),
  reviewer: one(moderator, {
    fields: [material.reviewedBy],
    references: [moderator.userId],
    relationName: 'reviewer',
  }),
  collections: many(collectionMaterial),
  adverts: many(advert),
}));
