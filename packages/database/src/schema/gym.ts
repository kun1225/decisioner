import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { users } from './user.js';

export const gyms = pgTable('gyms', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
