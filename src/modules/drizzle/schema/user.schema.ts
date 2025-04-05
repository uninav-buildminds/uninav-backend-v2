import {
  pgTable,
  uuid,
  text,
  integer,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userRoleEnum } from './enums.schema';
import { department } from './department.schema';
import { auth } from './auth.schema';
import { moderator } from './moderator.schema';
import { material } from './material.schema';
import { collection } from './collection.schema';
import { courses, studentCourses } from './course.schema';
import { bookmarks } from './collection.schema';
import { comments } from './comments.schema';
import { blogs } from 'src/modules/drizzle/schema/blog.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { TABLES } from '../tables.constants';

// Table Definition with Index on email
export const user = pgTable(
  TABLES.USERS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    username: text('username').notNull().unique(),
    departmentId: uuid('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    level: integer('level').notNull(),
    role: userRoleEnum('role').default('student'),
    ...timestamps,
  },
  (table) => ({
    emailIndex: index('users_email_index').on(table.email),
    usernameIndex: index('user_username_index').on(table.username),
  }),
);

export const userCourses = pgTable(
  TABLES.USERS_COURSES,
  {
    userId: uuid('user_id').references(() => user.id, {
      onDelete: 'cascade',
    }),
    courseId: uuid('course_id')
      .references(() => courses.id, {
        onDelete: 'cascade',
      })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey(table.userId, table.courseId),
  }),
);

export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(user, {
    fields: [userCourses.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.id],
  }),
}));

// Relations  ------

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
  auth: one(auth, {
    fields: [user.id],
    references: [auth.userId],
  }),
  courses: many(userCourses),
}));
