import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { material } from './material.schema';
import { users } from './user.schema';
import { timestamps } from './timestamps';
import { TABLES } from '../tables.constants';

export const materialLikes = pgTable(
  TABLES.MATERIAL_LIKES,
  {
    materialId: uuid('material_id')
      .references(() => material.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    ...timestamps,
  },
  (table) => ({
    pk: primaryKey({ columns: [table.materialId, table.userId] }),
  }),
);

export const materialLikesRelations = relations(materialLikes, ({ one }) => ({
  material: one(material, {
    fields: [materialLikes.materialId],
    references: [material.id],
  }),
  user: one(users, {
    fields: [materialLikes.userId],
    references: [users.id],
  }),
}));
