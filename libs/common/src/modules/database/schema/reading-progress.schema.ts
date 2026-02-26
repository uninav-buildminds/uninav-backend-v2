import {
  pgTable,
  uuid,
  integer,
  real,
  text,
  boolean,
  timestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './user.schema';
import { material } from './material.schema';
import { timestamps } from './timestamps';
import { TABLES } from '../tables.constants';

export const readingProgress = pgTable(
  TABLES.READING_PROGRESS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    materialId: uuid('material_id')
      .references(() => material.id, { onDelete: 'cascade' })
      .notNull(),

    // Page tracking for PDFs/Documents
    currentPage: integer('current_page').default(1),
    totalPages: integer('total_pages'),

    // For Google Drive folders - track which file is being viewed
    currentFilePath: text('current_file_path'), // e.g., "folder/subfolder/document.pdf"
    currentFileId: text('current_file_id'), // Google Drive file ID

    // Scroll position within current page/file (0-1 percentage)
    scrollPosition: real('scroll_position').default(0),

    // Overall progress through material (0-1 percentage)
    progressPercentage: real('progress_percentage').default(0),

    // Total time spent reading (in seconds)
    totalReadingTime: integer('total_reading_time').default(0),

    // Mark as completed
    isCompleted: boolean('is_completed').default(false),
    completedAt: timestamp('completed_at', { withTimezone: true }),

    // Last progress update
    lastProgressUpdate: timestamp('last_progress_update', {
      withTimezone: true,
    }).defaultNow(),

    ...timestamps,
  },
  (table) => ({
    userMaterialUnique: unique('progress_user_material_unique').on(
      table.userId,
      table.materialId,
    ),
    userIdIndex: index('progress_user_id_index').on(table.userId),
    materialIdIndex: index('progress_material_id_index').on(table.materialId),
    lastUpdateIndex: index('progress_last_update_index').on(
      table.lastProgressUpdate,
    ),
  }),
);

export const readingProgressRelations = relations(
  readingProgress,
  ({ one }) => ({
    user: one(users, {
      fields: [readingProgress.userId],
      references: [users.id],
    }),
    material: one(material, {
      fields: [readingProgress.materialId],
      references: [material.id],
    }),
  }),
);
