import {
  pgTable,
  uuid,
  text,
  primaryKey,
  check,
  integer,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { visibilityEnum } from './enums.schema';
import { bookmarks, users } from './user.schema';
import { material } from './material.schema';
import { advert } from './advert.schema';
import { TABLES } from '../tables.constants';
import { timestamps } from 'src/modules/drizzle/schema/timestamps';
import { courses } from 'src/modules/drizzle/schema/course.schema';

export const collection = pgTable(TABLES.COLLECTION, {
  id: uuid('id').primaryKey().defaultRandom(),
  creatorId: uuid('creator_id').references(() => users.id, {
    onDelete: 'cascade',
  }),
  label: text('label').notNull(),
  description: text('description'),
  visibility: visibilityEnum('visibility').default('public'),
  targetCourseId: uuid('target_course').references(() => courses.id, {
    onDelete: 'set null',
  }),

  likes: integer('likes').default(0),
  views: integer('views').default(0),
  ...timestamps,
});

export const collectionContent = pgTable(
  TABLES.COLLECTION_CONTENT,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    collectionId: uuid('collection_id').references(() => collection.id, {
      onDelete: 'cascade',
    }),
    contentMaterialId: uuid('content_material_id').references(
      () => material.id,
      {
        onDelete: 'cascade',
      },
    ),
    contentCollectionId: uuid('content_collection_id').references(
      () => collection.id,
      {
        onDelete: 'cascade',
      },
    ),
  },
  () => {
    return {
      // Ensure that each row links to EITHER a material OR a collection, but not both, and not neither.
      contentTypeCheck: check(
        'content_type_check',
        sql`(content_material_id IS NOT NULL AND content_collection_id IS NULL) OR (content_material_id IS NULL AND content_collection_id IS NOT NULL)`,
      ),
    };
  },
);

export const collectionRelations = relations(collection, ({ one, many }) => ({
  creator: one(users, {
    fields: [collection.creatorId],
    references: [users.id],
    relationName: 'collection_creator',
  }),
  // Explicitly define the relationship using collectionId
  content: many(collectionContent, {
    relationName: 'parent_collection', // Alias to avoid conflict if needed
  }),
  bookmarks: many(bookmarks),
  adverts: many(advert),
}));

export const collectionContentRelations = relations(
  collectionContent,
  ({ one }) => ({
    collection: one(collection, {
      fields: [collectionContent.collectionId],
      references: [collection.id],
      relationName: 'parent_collection', // Alias to avoid conflict if needed
    }),
    material: one(material, {
      fields: [collectionContent.contentMaterialId],
      references: [material.id],
    }),
    // Add relation for nested collection
    nestedCollection: one(collection, {
      fields: [collectionContent.contentCollectionId],
      references: [collection.id],
      relationName: 'nested_collection', // Alias to avoid conflict
    }),
  }),
);
