import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { user } from './user.schema';
import { userIdTypeEnum } from './enums.schema';

export const auth = pgTable(
  'auth',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => user.id, {
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
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at')
      .default(sql`(CURRENT_TIMESTAMP)`)
      .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
  },
  (table) => ({
    matricNoIndex: index('auth_matric_no_index').on(table.matricNo),
    emailIndex: index('auth_email_index').on(table.email),
  }),
);

// Auth relations
export const authRelations = relations(auth, ({ one }) => ({
  user: one(user, {
    fields: [auth.userId],
    references: [user.id],
  }),
}));
