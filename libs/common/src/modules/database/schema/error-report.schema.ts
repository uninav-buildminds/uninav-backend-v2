import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
  jsonb,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import { relations } from 'drizzle-orm';
import { TABLES } from '../tables.constants';

export const errorSeverityEnum = pgEnum('error_severity', [
  'low',
  'medium',
  'high',
  'critical',
]);

export const errorStatusEnum = pgEnum('error_status', [
  'open',
  'in_progress',
  'resolved',
  'closed',
]);

export const errorReports = pgTable(
  TABLES.ERROR_REPORTS ?? 'error_reports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').references(() => users.id, {
      onDelete: 'set null',
    }), // Optional - can be null for anonymous reports
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    errorType: varchar('error_type', { length: 100 }).notNull(), // e.g., 'upload_failure', 'api_error', 'ui_bug'
    severity: errorSeverityEnum('severity').notNull().default('medium'),
    status: errorStatusEnum('status').notNull().default('open'),
    // Store additional context like user agent, URL, stack trace, etc.
    metadata: jsonb('metadata'), // Flexible JSON field for additional data
    // Store the specific error details
    errorDetails: jsonb('error_details'), // Stack trace, error message, etc.
    // User environment info
    userAgent: text('user_agent'),
    url: text('url'), // URL where error occurred
    // Resolution info
    resolvedBy: uuid('resolved_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    resolutionNotes: text('resolution_notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('error_reports_user_id_index').on(table.userId),
    errorTypeIdx: index('error_reports_error_type_index').on(table.errorType),
    severityIdx: index('error_reports_severity_index').on(table.severity),
    statusIdx: index('error_reports_status_index').on(table.status),
    createdAtIdx: index('error_reports_created_at_index').on(table.createdAt),
  }),
);

export const errorReportsRelations = relations(errorReports, ({ one }) => ({
  user: one(users, {
    fields: [errorReports.userId],
    references: [users.id],
  }),
  resolvedByUser: one(users, {
    fields: [errorReports.resolvedBy],
    references: [users.id],
  }),
}));
