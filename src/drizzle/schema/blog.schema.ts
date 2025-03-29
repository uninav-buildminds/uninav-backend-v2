import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { blogTypeEnum } from './enums.schema';
import { comments } from './comments.schema';
import { user } from 'src/drizzle/schema/user.schema';

export const blogs = pgTable('blogs', {
  id: uuid('id').primaryKey().defaultRandom(),
  creator: uuid('creator')
    .references(() => user.id, {
      onDelete: 'cascade',
    })
    .notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  type: blogTypeEnum('type').notNull(),
  body: text('body').notNull(),
  likes: integer('likes').default(0),
  clicks: integer('clicks').default(0),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const blogRelations = relations(blogs, ({ one, many }) => ({
  comments: many(comments),
  creator: one(user, {
    fields: [blogs.creator],
    references: [user.id],
  }),
}));
