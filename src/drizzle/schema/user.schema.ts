import { pgTable, uuid, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userRoleEnum } from './enums.schema';
import { department } from './department.schema';

export const user = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  firstName: text('firstName').notNull(),
  lastName: text('lastName').notNull(),
  username: text('username').notNull().unique(),
  departmentId: uuid('department').references(() => department.id, {
    onDelete: 'set null',
  }),
  level: integer('level').notNull(),
  role: userRoleEnum('role').default('student'),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

// Relations  ------
// Used by other schemas to import the user type
import { moderator } from './moderator.schema';
import { material } from './material.schema';
import { collection } from './collection.schema';
import { studentCourses } from './course.schema';
import { bookmarks } from './collection.schema';
import { comments } from './comments.schema';
import { blogs } from 'src/drizzle/schema/blog.schema';

export const userRelations = relations(user, ({ one, many }) => ({
  department: one(department, {
    fields: [user.departmentId],
    references: [department.id],
  }),
  moderator: one(moderator, {
    fields: [user.id],
    references: [moderator.userId],
  }),
  materials: many(material),
  collections: many(collection),
  studentCourses: many(studentCourses),
  bookmarks: many(bookmarks),
  comments: many(comments),
  blogs: many(blogs),
}));
