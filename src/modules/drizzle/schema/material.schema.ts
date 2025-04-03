import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  materialReviewStatusEnum,
  visibilityEnum,
  restrictionEnum,
  materialTypeEnum,
} from './enums.schema';
import { user } from './user.schema';
import { moderator } from './moderator.schema';
import { collectionMaterial } from './collection.schema';
import { advert } from './advert.schema';
import { resource } from 'src/modules/drizzle/schema/resource.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { courses } from 'src/modules/drizzle/schema/course.schema';

export const material = pgTable('material', {
  id: uuid('id').primaryKey().defaultRandom(),
  type: materialTypeEnum('type').notNull(),
  tags: text('tags').array(),
  // statistics
  clickCount: integer('click_count').default(0),
  viewCount: integer('view_count').default(0),
  downloadCount: integer('download_count').default(0),
  likes: integer('likes').default(0),

  creatorId: uuid('creator').references(() => user.id, {
    onDelete: 'set null',
  }),
  label: text('label'),
  description: text('description'),
  visibility: visibilityEnum('visibility').default('public'),
  restriction: restrictionEnum('restriction').default('readonly'),

  targetCourse: uuid('target_course').references(() => courses.id, {
    onDelete: 'set null',
  }),
  reviewStatus: materialReviewStatusEnum('review_status').default('pending'),
  reviewedBy: uuid('reviewedBy').references(() => moderator.userId, {
    onDelete: 'set null',
  }),
  ...timestamps,
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
  resource: one(resource, {
    fields: [material.id],
    references: [resource.materialId],
  }),
  collections: many(collectionMaterial),
  adverts: many(advert),
  targetCourse: one(courses, {
    fields: [material.targetCourse],
    references: [courses.id],
  }),
}));
