import {
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

import { exercises } from './exercises.js';
import { users } from './user.js';

export const templates = pgTable('templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => users.id),
  name: varchar('name', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const templateItems = pgTable('template_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateId: uuid('template_id')
    .notNull()
    .references(() => templates.id),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  sortOrder: integer('sort_order').notNull(),
  note: varchar('note', { length: 500 }),
});

export const templateVersions = pgTable(
  'template_versions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    templateId: uuid('template_id')
      .notNull()
      .references(() => templates.id),
    versionNo: integer('version_no').notNull(),
    editedBy: uuid('edited_by')
      .notNull()
      .references(() => users.id),
    snapshotJson: jsonb('snapshot_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    unique().on(t.templateId, t.versionNo),
    index('tv_template_version_idx').on(t.templateId, t.versionNo),
  ],
);

export const templateVersionItems = pgTable('template_version_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  templateVersionId: uuid('template_version_id')
    .notNull()
    .references(() => templateVersions.id),
  exerciseId: uuid('exercise_id')
    .notNull()
    .references(() => exercises.id),
  sortOrder: integer('sort_order').notNull(),
  note: varchar('note', { length: 500 }),
});
