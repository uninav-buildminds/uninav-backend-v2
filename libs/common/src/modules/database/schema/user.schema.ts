import {
  pgTable,
  uuid,
  text,
  integer,
  index,
  primaryKey,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { userRoleEnum } from './enums.schema';
import { department } from './department.schema';
import { auth } from './auth.schema';
import { moderator } from './moderator.schema';
import { material } from './material.schema';
import { collection } from './collection.schema';
import { courses } from './course.schema';
import { comments } from './comments.schema';
import { blogs } from '@app/common/modules/database/schema/blog.schema';
import { timestamps } from '@app/common/modules/database/schema/timestamps';
import { TABLES } from '../tables.constants';
import { advert } from './advert.schema';

// Table Definition with Index on email
export const users = pgTable(
  TABLES.USERS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    firstName: text('first_name'),
    lastName: text('last_name'),
    username: text('username').notNull().unique(),
    googleId: text('google_id').unique(),
    departmentId: uuid('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    level: integer('level'),
    role: userRoleEnum('role').default('student'),
    profilePicture: text('profile_picture'),
    downloadCount: integer('download_count').default(0).notNull(),
    uploadCount: integer('upload_count').default(0).notNull(),
    ...timestamps,
  },
  (table) => ({
    emailIndex: index('users_email_index').on(table.email),
    usernameIndex: index('user_username_index').on(table.username),
    googleIdIndex: index('user_google_id_index').on(table.googleId),
  }),
);

export const userCourses = pgTable(
  TABLES.USERS_COURSES,
  {
    userId: uuid('user_id').references(() => users.id, {
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

export const bookmarks = pgTable(TABLES.BOOKMARKS, {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  materialId: uuid('material_id').references(() => material.id, {
    onDelete: 'cascade',
  }),
  collectionId: uuid('collection_id').references(() => collection.id, {
    onDelete: 'cascade',
  }),
  ...timestamps,
});

export const bookmarkRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  material: one(material, {
    fields: [bookmarks.materialId],
    references: [material.id],
  }),
  collection: one(collection, {
    fields: [bookmarks.collectionId],
    references: [collection.id],
  }),
}));

export const userCoursesRelations = relations(userCourses, ({ one }) => ({
  user: one(users, {
    fields: [userCourses.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [userCourses.courseId],
    references: [courses.id],
  }),
}));

// Relations  ------

export const userRelations = relations(users, ({ one, many }) => ({
  department: one(department, {
    fields: [users.departmentId],
    references: [department.id],
  }),
  moderator: one(moderator, {
    fields: [users.id],
    references: [moderator.userId],
    relationName: 'moderator_user',
  }),
  createdMaterials: many(material, { relationName: 'material_creator' }),
  reviewedMaterials: many(material, { relationName: 'material_reviewer' }),
  createdAdverts: many(advert, { relationName: 'advert_creator' }),
  reviewedAdverts: many(advert, { relationName: 'advert_reviewer' }),
  createdBlogs: many(blogs, { relationName: 'blog_creator' }),
  reviewedBlogs: many(blogs, { relationName: 'blog_reviewer' }),
  createdCourses: many(courses, { relationName: 'course_creator' }),
  reviewedCourses: many(courses, { relationName: 'course_reviewer' }),
  collections: many(collection),
  bookmarks: many(bookmarks),
  comments: many(comments),
  auth: one(auth, {
    fields: [users.id],
    references: [auth.userId],
  }),
  courses: many(userCourses),
}));
