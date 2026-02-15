import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

import { authProviderEnum } from './enums.js';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  authProvider: authProviderEnum('auth_provider').notNull().default('LOCAL'),
  hashedPassword: varchar('hashed_password', { length: 255 }),
  googleSub: varchar('google_sub', { length: 255 }).unique(),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});
