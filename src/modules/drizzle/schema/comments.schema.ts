import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { blogs } from './blog.schema';
import { user } from './user.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';

export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  blogId: uuid('blogId').references(() => blogs.id, { onDelete: 'cascade' }),
  userId: uuid('userId').references(() => user.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  ...timestamps,
});

export const commentRelations = relations(comments, ({ one }) => ({
  blog: one(blogs, {
    fields: [comments.blogId],
    references: [blogs.id],
  }),
  user: one(user, {
    fields: [comments.userId],
    references: [user.id],
  }),
}));
