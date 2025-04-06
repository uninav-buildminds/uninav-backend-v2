import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { blogTypeEnum } from './enums.schema';
import { comments } from './comments.schema';
import { users } from 'src/modules/drizzle/schema/user.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { TABLES } from '../tables.constants';

export const blogs = pgTable(TABLES.BLOGS, {
  id: uuid('id').primaryKey().defaultRandom(),
  creator: uuid('creator')
    .references(() => users.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: blogTypeEnum('type').notNull(),
  body: text('body').notNull(),
  likes: integer('likes').default(0),
  clicks: integer('clicks').default(0),
  ...timestamps,
});

export const blogRelations = relations(blogs, ({ one, many }) => ({
  comments: many(comments),
  creator: one(users, {
    fields: [blogs.creator],
    references: [users.id],
  }),
}));
