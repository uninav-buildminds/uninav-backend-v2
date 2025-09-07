import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { blogs } from './blog.schema';
import { users } from './user.schema';
import { timestamps } from '@app/common/modules/database/schema/timestamps';
import { TABLES } from '../tables.constants';

export const comments = pgTable(TABLES.COMMENTS, {
  id: uuid('id').primaryKey().defaultRandom(),
  blogId: uuid('blogId').references(() => blogs.id, { onDelete: 'cascade' }),
  userId: uuid('userId').references(() => users.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  ...timestamps,
});

export const commentRelations = relations(comments, ({ one }) => ({
  blog: one(blogs, {
    fields: [comments.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));
