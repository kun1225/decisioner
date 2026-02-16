import {
  boolean,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { crewRoleEnum, friendStatusEnum } from './enums.js';
import { templates } from './template.js';
import { users } from './user.js';

export const friends = pgTable(
  'friends',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    friendUserId: uuid('friend_user_id')
      .notNull()
      .references(() => users.id),
    status: friendStatusEnum('status').notNull().default('PENDING'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [unique().on(t.userId, t.friendUserId)],
);

export const crews = pgTable('crews', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const crewMembers = pgTable('crew_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  crewId: uuid('crew_id')
    .notNull()
    .references(() => crews.id),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  role: crewRoleEnum('role').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const templateShares = pgTable('template_shares', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => templates.id),
  crewId: uuid('crew_id')
    .notNull()
    .references(() => crews.id),
  sharedBy: uuid('shared_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const privacySettings = pgTable('privacy_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id),
  showWorkoutDate: boolean('show_workout_date').notNull().default(true),
  showWorkoutRecords: boolean('show_workout_records').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
