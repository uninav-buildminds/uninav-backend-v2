import { pgTable, uuid, text, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { department } from './department.schema';
import { user } from './user.schema';

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseName: text('course_name').notNull(),
  courseCode: text('course_code').notNull().unique(),
  description: text('description'),
});

export const departmentCourses = pgTable(
  'department_courses',
  {
    departmentId: uuid('department_id').references(() => department.id, {
      onDelete: 'cascade',
    }),
    courseId: uuid('course_id').references(() => courses.id, {
      onDelete: 'cascade',
    }),
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
  departmentCourses: many(departmentCourses),
  studentCourses: many(studentCourses),
}));

export const departmentCoursesRelations = relations(
  departmentCourses,
  ({ one }) => ({
    department: one(department, {
      fields: [departmentCourses.departmentId],
      references: [department.id],
    }),
    course: one(courses, {
      fields: [departmentCourses.courseId],
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
