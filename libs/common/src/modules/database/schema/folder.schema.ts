import {
  pgTable,
  uuid,
  text,
  primaryKey,
  check,
  integer,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { visibilityEnum } from './enums.schema';
import { bookmarks, users } from './user.schema';
import { material } from './material.schema';
import { advert } from './advert.schema';
import { TABLES } from '../tables.constants';
import { timestamps } from '@app/common/modules/database/schema/timestamps';
import { courses } from '@app/common/modules/database/schema/course.schema';

export const folder = pgTable(
  TABLES.FOLDER,
  {
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
    lastViewedAt: timestamp('last_viewed_at', { withTimezone: true }),
    slug: text('slug').unique(),
    ...timestamps,
  },
  (table) => {
    return {
      slugIdx: index('folder_slug_idx').on(table.slug),
    };
  },
);

export const folderContent = pgTable(TABLES.FOLDER_CONTENT, {
  id: uuid('id').primaryKey().defaultRandom(),
  folderId: uuid('folder_id').references(() => folder.id, {
    onDelete: 'cascade',
  }),
  contentMaterialId: uuid('content_material_id').references(() => material.id, {
    onDelete: 'cascade',
  }),
  contentFolderId: uuid('content_folder_id').references(() => folder.id, {
    onDelete: 'cascade',
  }),
});
// () => {
//   return {
//     // Ensure that each row links to EITHER a material OR a folder, but not both, and not neither.
//     contentTypeCheck: check(
//       'content_type_check',
//       sql`(content_material_id IS NOT NULL AND content_folder_id IS NULL) OR (content_material_id IS NULL AND content_folder_id IS NOT NULL)`,
//     ),
//   };
// },

export const folderRelations = relations(folder, ({ one, many }) => ({
  creator: one(users, {
    fields: [folder.creatorId],
    references: [users.id],
    relationName: 'folder_creator',
  }),
  // Explicitly define the relationship using folderId
  content: many(folderContent, {
    relationName: 'parent_folder', // Alias to avoid conflict if needed
  }),
  bookmarks: many(bookmarks),
  adverts: many(advert),
}));

export const folderContentRelations = relations(folderContent, ({ one }) => ({
  folder: one(folder, {
    fields: [folderContent.folderId],
    references: [folder.id],
    relationName: 'parent_folder', // Alias to avoid conflict if needed
  }),
  material: one(material, {
    fields: [folderContent.contentMaterialId],
    references: [material.id],
  }),
  // Add relation for nested folder
  nestedFolder: one(folder, {
    fields: [folderContent.contentFolderId],
    references: [folder.id],
    relationName: 'nested_folder', // Alias to avoid conflict
  }),
}));
