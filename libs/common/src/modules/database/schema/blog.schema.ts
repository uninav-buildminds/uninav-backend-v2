import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { approvalStatusEnum, blogTypeEnum } from './enums.schema';
import { comments } from './comments.schema';
import { users } from '@app/common/modules/database/schema/user.schema';
import { timestamps } from '@app/common/modules/database/schema/timestamps';
import { TABLES } from '../tables.constants';
import { blogLikes } from './blog-likes.schema';

export const blogs = pgTable(TABLES.BLOGS, {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator')
    .references(() => users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: blogTypeEnum('type').notNull(),
  // Store image URL from 'uninav-media' bucket
  headingImageAddress: text('headingAddress').notNull(),
  // Store content URL from 'uninav-blogs' bucket
  bodyAddress: text('bodyAddress').notNull(),
  // Keep track of the file keys for deletion operations
  headingImageKey: text('headingImageKey'),
  bodyKey: text('bodyKey'),
  likes: integer('likes').default(0),
  views: integer('views').default(0),
  tags: text('tags').array(),

  reviewStatus: approvalStatusEnum('review_status').default('pending'),
  reviewedById: uuid('reviewed_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
});

export const blogRelations = relations(blogs, ({ one, many }) => ({
  comments: many(comments),
  creator: one(users, {
    fields: [blogs.creatorId],
    references: [users.id],
    relationName: 'blog_creator',
  }),
  likes: many(blogLikes),

  reviewedBy: one(users, {
    fields: [blogs.reviewedById],
    references: [users.id],
    relationName: 'blog_reviewer',
  }),
}));
