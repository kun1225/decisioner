import {
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import {
  sessionItemOriginEnum,
  sessionStatusEnum,
  weightUnitEnum,
} from './enums.js';
import { exercises } from './exercises.js';
import { gyms } from './gym.js';
import { templates, templateVersions } from './template.js';
import { users } from './user.js';

export const workoutSessions = pgTable(
  'workout_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    gymId: uuid('gym_id').references(() => gyms.id),
    templateId: uuid('template_id').references(() => templates.id),
    templateVersionId: uuid('template_version_id').references(
      () => templateVersions.id,
    ),
    status: sessionStatusEnum('status').notNull(),
    sessionDate: date('session_date').notNull(),
    lastEditedAt: timestamp('last_edited_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('ws_user_date_idx').on(t.userId, t.sessionDate),
    index('ws_user_status_date_idx').on(t.userId, t.status, t.sessionDate),
  ],
);

export const workoutSessionItems = pgTable(
  'workout_session_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    originType: sessionItemOriginEnum('origin_type').notNull(),
    sortOrder: integer('sort_order').notNull(),
  },
  (t) => [index('wsi_exercise_idx').on(t.exerciseId)],
);

export const workoutSets = pgTable(
  'workout_sets',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionItemId: uuid('session_item_id')
      .notNull()
      .references(() => workoutSessionItems.id),
    setIndex: integer('set_index').notNull(),
    weight: numeric('weight').notNull(),
    reps: integer('reps').notNull(),
    unit: weightUnitEnum('unit').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index('wsets_item_idx').on(t.sessionItemId, t.setIndex)],
);

export const workoutSessionRevisions = pgTable(
  'workout_session_revisions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id),
    revisionNo: integer('revision_no').notNull(),
    editedBy: uuid('edited_by')
      .notNull()
      .references(() => users.id),
    reason: varchar('reason', { length: 500 }),
    snapshotJson: jsonb('snapshot_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.sessionId, t.revisionNo),
    index('wsr_session_rev_idx').on(t.sessionId, t.revisionNo),
  ],
);
