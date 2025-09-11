import { pgTable, uuid, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';
import { material } from './material.schema';
import { TABLES } from '../tables.constants';
import { timestamps } from '@app/common/modules/database/schema/timestamps';

export const recent = pgTable(
  TABLES.RECENT,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    materialId: uuid('material_id')
      .references(() => material.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => {
    return {
      // Unique constraint to prevent duplicate entries for same user-material pair
      userMaterialUnique: unique('recent_user_material_unique').on(
        table.userId,
        table.materialId,
      ),
      // Index for efficient querying by user
      userIdIndex: index('recent_user_id_index').on(table.userId),
      // Index for efficient querying by material
      materialIdIndex: index('recent_material_id_index').on(table.materialId),
      // Index for efficient ordering by last viewed
      lastViewedIndex: index('recent_last_viewed_index').on(table.lastViewedAt),
    };
  },
);

export const recentRelations = relations(recent, ({ one }) => ({
  user: one(users, {
    fields: [recent.userId],
    references: [users.id],
    relationName: 'recent_user',
  }),
  material: one(material, {
    fields: [recent.materialId],
    references: [material.id],
    relationName: 'recent_material',
  }),
}));
