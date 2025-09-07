import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';
import { TABLES } from '../tables.constants';

export const admin = pgTable(TABLES.ADMIN, {
  userId: uuid('userId')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
});

export const adminRelations = relations(admin, ({ one }) => ({
  user: one(users, {
    fields: [admin.userId],
    references: [users.id],
  }),
}));
