import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { approvalStatusEnum } from './enums.schema';
import { user } from './user.schema';
import { department } from './department.schema';
import { faculty } from './faculty.schema';
import { material } from './material.schema';

export const moderator = pgTable('moderator', {
  userId: uuid('userId')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  departmentId: uuid('department').references(() => department.id, {
    onDelete: 'set null',
  }),
  facultyId: uuid('faculty').references(() => faculty.id, {
    onDelete: 'set null',
  }),
  reviewStatus: approvalStatusEnum('review_status').default('pending'),
});

export const moderatorRelations = relations(moderator, ({ one, many }) => ({
  user: one(user, {
    fields: [moderator.userId],
    references: [user.id],
  }),
  department: one(department, {
    fields: [moderator.departmentId],
    references: [department.id],
  }),
  faculty: one(faculty, {
    fields: [moderator.facultyId],
    references: [faculty.id],
  }),
  reviewedMaterials: many(material, { relationName: 'reviewer' }),
}));
