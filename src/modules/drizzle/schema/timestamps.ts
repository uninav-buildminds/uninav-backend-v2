import { text, timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp('createdAt').defaultNow().notNull(),
  updatedAt: timestamp('updatedAt').defaultNow().notNull(),
};
