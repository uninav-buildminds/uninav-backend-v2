import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { approvalStatusEnum } from './enums.schema';
import { users } from './user.schema';
import { department } from './department.schema';
import { faculty } from './faculty.schema';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { material } from './material.schema';
import { TABLES } from '../tables.constants';

export const moderator = pgTable(TABLES.MODERATOR, {
  userId: uuid('userId')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),

  departmentId: uuid('department_id').references(() => department.id, {
    onDelete: 'set null',
  }),
  reviewStatus: approvalStatusEnum('review_status').default('pending'),
  reviewedById: uuid('reviewed_by').references(() => users.id, {
    onDelete: 'set null',
  }),
  ...timestamps,
});

export const moderatorRelations = relations(moderator, ({ one, many }) => ({
  user: one(users, {
    fields: [moderator.userId],
    references: [users.id],
  }),

  reviewedBy: one(users, {
    fields: [moderator.reviewedById],
    references: [users.id],
  }),
  reviewedMaterials: many(material, { relationName: 'reviewer' }),
}));
