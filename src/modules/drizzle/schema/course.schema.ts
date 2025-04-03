import { pgTable, uuid, text, primaryKey, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { department } from './department.schema';
import { user } from './user.schema';
import { courseStatusEnum } from 'src/modules/drizzle/schema/enums.schema';
import { moderator } from 'src/modules/drizzle/schema/moderator.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseName: text('courseName').notNull(),
  courseCode: text('courseCode').notNull().unique(),
  description: text('description').notNull(),
  reviewStatus: courseStatusEnum('reviewStatus').default('pending'),
  reviewedBy: uuid('reviewedBy').references(() => moderator.userId, {
    onDelete: 'set null',
  }),
  ...timestamps,
});

export const departmentLevelCourses = pgTable(
  'department_level_courses',
  {
    departmentId: uuid('departmentId').references(() => department.id, {
      onDelete: 'cascade',
    }),
    courseId: uuid('courseId').references(() => courses.id, {
      onDelete: 'cascade',
    }),
    level: integer('level').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.departmentId, table.courseId] }),
    };
  },
);

export const studentCourses = pgTable(
  'student_courses',
  {
    userId: uuid('userId').references(() => user.id, { onDelete: 'cascade' }),
    courseId: uuid('courseId').references(() => courses.id, {
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
