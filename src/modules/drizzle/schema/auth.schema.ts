import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './user.schema';
import { userIdTypeEnum } from './enums.schema';
import { TABLES } from '../tables.constants';

export const auth = pgTable(
  TABLES.AUTH,
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, {
        onDelete: 'cascade',
      })
      .notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false),
    password: text('password').notNull(),
    matricNo: text('matric_no').unique(),

    userIdType: userIdTypeEnum('user_id_type'),
    userIdImage: text('user_id_image'), // URL to the ID image
    userIdVerified: boolean('user_id_verified').default(false),
  },
  (table) => ({
    matricNoIndex: index('auth_matric_no_index').on(table.matricNo),
    emailIndex: index('auth_email_index').on(table.email),
  }),
);

// Auth relations
export const authRelations = relations(auth, ({ one }) => ({
  user: one(users, {
    fields: [auth.userId],
    references: [users.id],
  }),
}));
