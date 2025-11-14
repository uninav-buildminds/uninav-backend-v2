import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';
import { TABLES } from '../tables.constants';
import { timestamps } from '@app/common/modules/database/schema/timestamps';

export const searchHistory = pgTable(
  TABLES.SEARCH_HISTORY,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    query: text('query').notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      // Index for efficient querying by user
      userIdIndex: index('search_history_user_id_index').on(table.userId),
      // Index for efficient ordering by creation date (most recent first)
      createdAtIndex: index('search_history_created_at_index').on(
        table.createdAt,
      ),
      // Composite index for user + createdAt queries
      userCreatedAtIndex: index('search_history_user_created_at_index').on(
        table.userId,
        table.createdAt,
      ),
    };
  },
);

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, {
    fields: [searchHistory.userId],
    references: [users.id],
    relationName: 'search_history_user',
  }),
}));
