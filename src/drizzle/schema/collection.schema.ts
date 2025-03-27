import { pgTable, uuid, text, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { visibilityEnum } from './enums.schema';
import { user } from './user.schema';
import { material } from './material.schema';
import { advert } from './advert.schema';

export const collection = pgTable('collection', {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator').references(() => user.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  description: text('description'),
  visibility: visibilityEnum('visibility').default('public'),
});

export const collectionMaterial = pgTable(
  'collection_material',
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
  'bookmarks',
  {
    userId: uuid('user_id').references(() => user.id, { onDelete: 'cascade' }),
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
  creator: one(user, {
    fields: [collection.creatorId],
    references: [user.id],
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
  user: one(user, {
    fields: [bookmarks.userId],
    references: [user.id],
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
