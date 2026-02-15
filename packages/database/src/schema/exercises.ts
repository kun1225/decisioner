import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { exerciseSourceEnum } from './enums.js';
import { users } from './user.js';

export const exercises = pgTable('exercises', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  source: exerciseSourceEnum('source').notNull(),
  imageUrl: varchar('image_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});
