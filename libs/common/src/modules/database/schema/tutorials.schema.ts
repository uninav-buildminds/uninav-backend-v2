import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';
import { department } from './department.schema';
import { timestamps } from './timestamps';
import { TABLES } from '../tables.constants';

export const tutorials = pgTable(TABLES.TUTORIALS, {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  courseCode: text('course_code').notNull(),
  level: integer('level').notNull(),
  departmentId: uuid('department_id')
    .references(() => department.id, { onDelete: 'cascade' })
    .notNull(),
  tutorId: uuid('tutor_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ...timestamps,
});

export const modules = pgTable(TABLES.MODULES, {
  id: uuid('id').primaryKey().defaultRandom(),
  tutorialId: uuid('tutorial_id')
    .references(() => tutorials.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  ...timestamps,
});

export const lessons = pgTable(TABLES.LESSONS, {
  id: uuid('id').primaryKey().defaultRandom(),
  moduleId: uuid('module_id')
    .references(() => modules.id, { onDelete: 'cascade' })
    .notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  order: integer('order').notNull(),
  ...timestamps,
});

export const enrollments = pgTable(TABLES.ENROLLMENTS, {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  tutorialId: uuid('tutorial_id')
    .references(() => tutorials.id, { onDelete: 'cascade' })
    .notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  ...timestamps,
});

export const lessonProgress = pgTable(TABLES.LESSON_PROGRESS, {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id')
    .references(() => enrollments.id, { onDelete: 'cascade' })
    .notNull(),
  lessonId: uuid('lesson_id')
    .references(() => lessons.id, { onDelete: 'cascade' })
    .notNull(),
  completed: boolean('completed').default(false).notNull(),
  completedAt: timestamp('completed_at'),
  ...timestamps,
});

export const tutorialRelations = relations(tutorials, ({ one, many }) => ({
  tutor: one(users, {
    fields: [tutorials.tutorId],
    references: [users.id],
  }),
  department: one(department, {
    fields: [tutorials.departmentId],
    references: [department.id],
  }),
  modules: many(modules),
  enrollments: many(enrollments),
}));

export const moduleRelations = relations(modules, ({ one, many }) => ({
  tutorial: one(tutorials, {
    fields: [modules.tutorialId],
    references: [tutorials.id],
  }),
  lessons: many(lessons),
}));

export const lessonRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, {
    fields: [lessons.moduleId],
    references: [modules.id],
  }),
  progress: many(lessonProgress),
}));

export const enrollmentRelations = relations(enrollments, ({ one, many }) => ({
  user: one(users, {
    fields: [enrollments.userId],
    references: [users.id],
  }),
  tutorial: one(tutorials, {
    fields: [enrollments.tutorialId],
    references: [tutorials.id],
  }),
  progress: many(lessonProgress),
}));

export const lessonProgressRelations = relations(lessonProgress, ({ one }) => ({
  enrollment: one(enrollments, {
    fields: [lessonProgress.enrollmentId],
    references: [enrollments.id],
  }),
  lesson: one(lessons, {
    fields: [lessonProgress.lessonId],
    references: [lessons.id],
  }),
}));
