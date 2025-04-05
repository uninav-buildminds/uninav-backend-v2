import { pgTable, uuid, text, primaryKey, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { department } from './department.schema';
import { user } from './user.schema';
import { moderator } from 'src/modules/drizzle/schema/moderator.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { approvalStatusEnum } from 'src/modules/drizzle/schema/enums.schema';
import { TABLES } from '../tables.constants';

export const courses = pgTable(TABLES.COURSES, {
  id: uuid('id').primaryKey().defaultRandom(),
  courseName: text('course_name').notNull(),
  courseCode: text('course_code').notNull().unique(),
  description: text('description').notNull(),
  reviewStatus: approvalStatusEnum('review_status').default('pending'),
  reviewedBy: uuid('reviewed_by').references(() => moderator.userId, {
    onDelete: 'set null',
  }),
  ...timestamps,
});

export const departmentLevelCourses = pgTable(
  TABLES.DEPARTMENT_LEVEL_COURSES,
  {
    departmentId: uuid('department_id').references(() => department.id, {
      onDelete: 'cascade',
    }),
    courseId: uuid('course_id').references(() => courses.id, {
      onDelete: 'cascade',
    }),
    level: integer('level').notNull(),
    reviewStatus: approvalStatusEnum('review_status').default('pending'),
    reviewedBy: uuid('reviewed_by').references(() => moderator.userId, {
      onDelete: 'set null',
    }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.departmentId, table.courseId] }),
    };
  },
);

export const studentCourses = pgTable(
  TABLES.STUDENT_COURSES,
  {
    userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id').references(() => courses.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.userId, table.courseId] }),
    };
  },
);

export const courseRelations = relations(courses, ({ many }) => ({
  departmentCourses: many(departmentLevelCourses),
  studentCourses: many(studentCourses),
}));

export const departmentLevelCoursesRelations = relations(
  departmentLevelCourses,
  ({ one }) => ({
    department: one(department, {
      fields: [departmentLevelCourses.departmentId],
      references: [department.id],
    }),
    course: one(courses, {
      fields: [departmentLevelCourses.courseId],
      references: [courses.id],
    }),
  }),
);

export const studentCoursesRelations = relations(studentCourses, ({ one }) => ({
  user: one(user, {
    fields: [studentCourses.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [studentCourses.courseId],
    references: [courses.id],
  }),
}));
