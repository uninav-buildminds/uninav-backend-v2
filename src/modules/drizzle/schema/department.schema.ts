import { pgTable, uuid, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { faculty } from './faculty.schema';
import { departmentLevelCourses } from './course.schema';
import { users } from './user.schema';
import { moderator } from './moderator.schema';
import { TABLES } from '../tables.constants';

export const department = pgTable(TABLES.DEPARTMENT, {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  facultyId: uuid('facultyId').references(() => faculty.id, {
    onDelete: 'cascade',
  }),
});

export const departmentRelations = relations(department, ({ one, many }) => ({
  faculty: one(faculty, {
    fields: [department.facultyId],
    references: [faculty.id],
  }),
  users: many(users),
  departmentCourses: many(departmentLevelCourses),
  moderators: many(moderator),
}));
