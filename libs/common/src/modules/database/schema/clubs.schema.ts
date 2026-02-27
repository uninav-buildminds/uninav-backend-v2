import {
  pgTable,
  uuid,
  text,
  primaryKey,
  timestamp as pgTimestamp,
  index,
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  clubStatusEnum,
  clubTargetingEnum,
  clubFlagStatusEnum,
  clubRequestStatusEnum,
} from './enums.schema';
import { users } from './user.schema';
import { department } from './department.schema';
import { timestamps } from './timestamps';
import { TABLES } from '../tables.constants';

// Clubs
export const clubs = pgTable(TABLES.CLUBS, {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  externalLink: text('external_link').notNull(),
  imageUrl: text('image_url'),
  imageKey: text('image_key'),
  tags: text('tags').array(),
  interests: text('interests').array(),
  slug: text('slug').unique().notNull(),
  targeting: clubTargetingEnum('targeting').default('public').notNull(),
  status: clubStatusEnum('status').default('live').notNull(),
  organizerId: uuid('organizer_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  ...timestamps,
});

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  organizer: one(users, {
    fields: [clubs.organizerId],
    references: [users.id],
    relationName: 'club_organizer',
  }),
  targetDepartments: many(clubTargetDepartments),
  clicks: many(clubClicks),
  views: many(clubViews),
  joins: many(clubJoins),
  flags: many(clubFlags),
}));

// Club + Department targeting
export const clubTargetDepartments = pgTable(
  TABLES.CLUB_TARGET_DEPARTMENTS,
  {
    clubId: uuid('club_id')
      .references(() => clubs.id, { onDelete: 'cascade' })
      .notNull(),
    departmentId: uuid('department_id')
      .references(() => department.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.clubId, table.departmentId] }),
  }),
);

export const clubTargetDepartmentsRelations = relations(
  clubTargetDepartments,
  ({ one }) => ({
    club: one(clubs, {
      fields: [clubTargetDepartments.clubId],
      references: [clubs.id],
    }),
    department: one(department, {
      fields: [clubTargetDepartments.departmentId],
      references: [department.id],
    }),
  }),
);

// Clicks tracking
export const clubClicks = pgTable(
  TABLES.CLUB_CLICKS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id')
      .references(() => clubs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    departmentId: uuid('department_id').references(() => department.id, {
      onDelete: 'set null',
    }),
    clickedAt: pgTimestamp('clicked_at').defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('club_clicks_club_id_idx').on(table.clubId),
  }),
);

export const clubClicksRelations = relations(clubClicks, ({ one }) => ({
  club: one(clubs, {
    fields: [clubClicks.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubClicks.userId],
    references: [users.id],
  }),
  department: one(department, {
    fields: [clubClicks.departmentId],
    references: [department.id],
  }),
}));

// Page view tracking (detail page visits, deduped per user per day)
export const clubViews = pgTable(
  TABLES.CLUB_VIEWS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id')
      .references(() => clubs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    viewedAt: pgTimestamp('viewed_at').defaultNow().notNull(),
  },
  (table) => ({
    clubIdIdx: index('club_views_club_id_idx').on(table.clubId),
  }),
);

export const clubViewsRelations = relations(clubViews, ({ one }) => ({
  club: one(clubs, {
    fields: [clubViews.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubViews.userId],
    references: [users.id],
  }),
}));

// Join tracking (unique per user — one record per user who clicks "Join Now")
export const clubJoins = pgTable(
  TABLES.CLUB_JOINS,
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clubId: uuid('club_id')
      .references(() => clubs.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: pgTimestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    clubUserUnique: unique('club_joins_club_user_unique').on(
      table.clubId,
      table.userId,
    ),
    clubIdIdx: index('club_joins_club_id_idx').on(table.clubId),
  }),
);

export const clubJoinsRelations = relations(clubJoins, ({ one }) => ({
  club: one(clubs, {
    fields: [clubJoins.clubId],
    references: [clubs.id],
  }),
  user: one(users, {
    fields: [clubJoins.userId],
    references: [users.id],
  }),
}));

// Club flagging
export const clubFlags = pgTable(TABLES.CLUB_FLAGS, {
  id: uuid('id').primaryKey().defaultRandom(),
  clubId: uuid('club_id')
    .references(() => clubs.id, { onDelete: 'cascade' })
    .notNull(),
  reporterId: uuid('reporter_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  reason: text('reason').notNull(),
  status: clubFlagStatusEnum('status').default('pending').notNull(),
  ...timestamps,
});

export const clubFlagsRelations = relations(clubFlags, ({ one }) => ({
  club: one(clubs, {
    fields: [clubFlags.clubId],
    references: [clubs.id],
  }),
  reporter: one(users, {
    fields: [clubFlags.reporterId],
    references: [users.id],
    relationName: 'flag_reporter',
  }),
}));

// Club requests
export const clubRequests = pgTable(TABLES.CLUB_REQUESTS, {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  interest: text('interest').notNull(),
  message: text('message'),
  requesterId: uuid('requester_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  status: clubRequestStatusEnum('status').default('pending').notNull(),
  ...timestamps,
});

export const clubRequestsRelations = relations(clubRequests, ({ one }) => ({
  requester: one(users, {
    fields: [clubRequests.requesterId],
    references: [users.id],
    relationName: 'club_requester',
  }),
}));
