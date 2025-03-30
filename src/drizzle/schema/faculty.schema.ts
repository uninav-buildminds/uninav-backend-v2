import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { department } from './department.schema';
import { moderator } from './moderator.schema';

export const faculty = pgTable('faculty', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

export const facultyRelations = relations(faculty, ({ many }) => ({
  departments: many(department),
  moderators: many(moderator),
}));
