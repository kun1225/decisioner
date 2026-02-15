import {
  date,
  index,
  integer,
  numeric,
  pgTable,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import { exercises } from './exercises.js';
import { users } from './user.js';
import { workoutSessions } from './workout.js';

export const exerciseSessionMetrics = pgTable(
  'exercise_session_metrics',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    exerciseId: uuid('exercise_id')
      .notNull()
      .references(() => exercises.id),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => workoutSessions.id),
    sessionDate: date('session_date').notNull(),
    maxWeight: numeric('max_weight').notNull(),
    maxWeightReps: integer('max_weight_reps').notNull(),
    maxWeightSetIndex: integer('max_weight_set_index').notNull(),
    volume: numeric('volume').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index('esm_user_exercise_date_idx').on(
      t.userId,
      t.exerciseId,
      t.sessionDate,
    ),
    index('esm_user_exercise_weight_idx').on(
      t.userId,
      t.exerciseId,
      t.maxWeight,
    ),
  ],
);
