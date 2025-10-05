import {
  pgEnum,
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { users } from './user.schema';
import { relations } from 'drizzle-orm';
import { TABLES } from '../tables.constants';

export const notificationStatusEnum = pgEnum('notification_status', [
  'unread',
  'read',
]);

export const notifications = pgTable(
  TABLES.NOTIFICATIONS ?? 'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    // Keep type as a flexible text field so we can add new types without migrations
    type: varchar('type', { length: 64 }).notNull().default('system'),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description').notNull(),
    // optional foreign key or identifier that the notification is about
    resourceId: varchar('resource_id', { length: 64 }),
    status: notificationStatusEnum('status').notNull().default('unread'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdIdx: index('notifications_user_id_index').on(table.userId),
    createdAtIdx: index('notifications_created_at_index').on(table.createdAt),
    statusIdx: index('notifications_status_index').on(table.status),
  }),
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
