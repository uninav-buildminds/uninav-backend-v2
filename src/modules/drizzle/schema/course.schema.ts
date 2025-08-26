import { pgTable, uuid, text, primaryKey, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { department } from './department.schema';
import { userCourses, users } from './user.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { approvalStatusEnum } from 'src/modules/drizzle/schema/enums.schema';
import { TABLES } from '../tables.constants';

export const courses = pgTable(TABLES.COURSES, {
  id: uuid('id').primaryKey().defaultRandom(),
  courseName: text('course_name').notNull(),
  courseCode: text('course_code').notNull().unique(),
  description: text('description').notNull(),
  creatorId: uuid('creator_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  reviewStatus: approvalStatusEnum('review_status').default('pending'),
  reviewedById: uuid('reviewed_by').references(() => users.id, {
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
    reviewedById: uuid('reviewed_by').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.departmentId, table.courseId] }),
    };
  },
);

export const courseRelations = relations(courses, ({ one, many }) => ({
  creator: one(users, {
    fields: [courses.creatorId],
    references: [users.id],
    relationName: 'course_creator',
  }),
  reviewedBy: one(users, {
    fields: [courses.reviewedById],
    references: [users.id],
    relationName: 'course_reviewer',
  }),
  departments: many(departmentLevelCourses),
  userCourses: many(userCourses),
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
