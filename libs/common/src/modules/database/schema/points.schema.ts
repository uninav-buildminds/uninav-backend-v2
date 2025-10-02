import { pgTable, uuid, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';
import { TABLES } from '../tables.constants';
import { timestamps } from './timestamps';

export const points = pgTable(
  TABLES.POINTS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    amount: integer('amount').notNull().default(1),
    ...timestamps,
  },
  (table) => ({
    userIdIndex: index('points_user_id_index').on(table.userId),
    createdAtIndex: index('points_created_at_index').on(table.createdAt),
  }),
);

export const pointsRelations = relations(points, ({ one }) => ({
  user: one(users, {
    fields: [points.userId],
    references: [users.id],
  }),
}));
