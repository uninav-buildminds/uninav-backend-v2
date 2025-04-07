import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { blogs } from './blog.schema';
import { users } from './user.schema';
import { timestamps } from './timestamps';
import { TABLES } from '../tables.constants';

export const blogLikes = pgTable(
  TABLES.BLOG_LIKES,
  {
    blogId: uuid('blogId')
      .references(() => blogs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('userId')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.blogId, table.userId] }),
  }),
);

export const blogLikesRelations = relations(blogLikes, ({ one }) => ({
  blog: one(blogs, {
    fields: [blogLikes.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [blogLikes.userId],
    references: [users.id],
  }),
}));
