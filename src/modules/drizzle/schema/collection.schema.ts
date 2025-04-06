import { pgTable, uuid, text, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { visibilityEnum } from './enums.schema';
import { users } from './user.schema';
import { material } from './material.schema';
import { advert } from './advert.schema';
import { TABLES } from '../tables.constants';

export const collection = pgTable(TABLES.COLLECTION, {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  label: text('label').notNull(),
  description: text('description'),
  visibility: visibilityEnum('visibility').default('public'),
});

export const collectionMaterial = pgTable(
  TABLES.COLLECTION_MATERIAL,
  {
    collectionId: uuid('collection_id').references(() => collection.id, {
      onDelete: 'cascade',
    }),
    materialId: uuid('material_id').references(() => material.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.collectionId, table.materialId] }),
    };
  },
);

export const bookmarks = pgTable(
  TABLES.BOOKMARKS,
  {
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
    materialId: uuid('material_id').references(() => material.id, {
      onDelete: 'cascade',
    }),
    collectionId: uuid('collection_id').references(() => collection.id, {
      onDelete: 'cascade',
    }),
  },
  (table) => {
    return {
      pk: primaryKey({
        columns: [table.userId, table.materialId, table.collectionId],
      }),
    };
  },
);

export const collectionRelations = relations(collection, ({ one, many }) => ({
  creator: one(users, {
    fields: [collection.creatorId],
    references: [users.id],
  }),
  materials: many(collectionMaterial),
  bookmarks: many(bookmarks),
  adverts: many(advert),
}));

export const collectionMaterialRelations = relations(
  collectionMaterial,
  ({ one }) => ({
    collection: one(collection, {
      fields: [collectionMaterial.collectionId],
      references: [collection.id],
    }),
    material: one(material, {
      fields: [collectionMaterial.materialId],
      references: [material.id],
    }),
  }),
);

export const bookmarkRelations = relations(bookmarks, ({ one }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  material: one(material, {
    fields: [bookmarks.materialId],
    references: [material.id],
  }),
  collection: one(collection, {
    fields: [bookmarks.collectionId],
    references: [collection.id],
  }),
}));
