import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const BASE_URL = 'postgresql://joygym:joygym@localhost:5432';
const __dirname = dirname(fileURLToPath(import.meta.url));
const DRIZZLE_DIR = resolve(__dirname, '../../drizzle');
const PREVIOUS_MIGRATIONS = [
  '0000_polite_skin.sql',
  '0001_swift_doomsday.sql',
  '0002_fancy_marauders.sql',
  '0003_perfect_texas_twister.sql',
];
const TARGET_MIGRATION = '0004_milky_iron_patriot.sql';

const OWNER_ID = '00000000-0000-0000-0000-000000000001';
const TEMPLATE_IDS = [
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000012',
];
const EXERCISE_IDS = [
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000102',
  '00000000-0000-0000-0000-000000000103',
  '00000000-0000-0000-0000-000000000104',
  '00000000-0000-0000-0000-000000000105',
];
const ITEM_IDS = [
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000202',
  '00000000-0000-0000-0000-000000000203',
  '00000000-0000-0000-0000-000000000204',
  '00000000-0000-0000-0000-000000000205',
];

const dbName = `joygym_template_migration_${randomUUID().replaceAll('-', '_')}`;

async function main() {
  await createDatabase(dbName);

  const client = new pg.Client({
    connectionString: `${BASE_URL}/${dbName}`,
  });

  try {
    await client.connect();

    for (const migration of PREVIOUS_MIGRATIONS) {
      await executeMigrationFile(client, migration);
    }

    await seedDirtyTemplateItems(client);
    await executeMigrationFile(client, TARGET_MIGRATION);

    await assertNormalizedSortOrder(client);
    await assertUniqueConstraintExists(client);
  } finally {
    await client.end().catch(() => undefined);
    await dropDatabase(dbName);
  }
}

async function createDatabase(name: string) {
  const client = new pg.Client({ connectionString: `${BASE_URL}/postgres` });

  try {
    await client.connect();
    await client.query(`CREATE DATABASE "${name}"`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function dropDatabase(name: string) {
  const client = new pg.Client({ connectionString: `${BASE_URL}/postgres` });

  try {
    await client.connect();
    await client.query(
      `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1
          AND pid <> pg_backend_pid()
      `,
      [name],
    );
    await client.query(`DROP DATABASE IF EXISTS "${name}"`);
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function executeMigrationFile(client: pg.Client, fileName: string) {
  const migrationPath = resolve(DRIZZLE_DIR, fileName);
  const migrationSql = await readFile(migrationPath, 'utf8');
  const statements = migrationSql
    .split('--> statement-breakpoint')
    .map((statement) => statement.trim())
    .filter(Boolean);

  for (const statement of statements) {
    await client.query(statement);
  }
}

async function seedDirtyTemplateItems(client: pg.Client) {
  await client.query(
    `
      INSERT INTO users (id, email, name, hashed_password, auth_provider)
      VALUES ($1, $2, $3, $4, 'LOCAL')
    `,
    [OWNER_ID, 'migration-test@example.com', 'Migration Test User', 'hash'],
  );

  await client.query(
    `
      INSERT INTO templates (id, owner_id, name, description, deleted_at)
      VALUES
        ($1, $4, $5, NULL, NULL),
        ($2, $4, $6, NULL, NULL),
        ($3, $4, $7, NULL, NULL)
    `,
    [
      TEMPLATE_IDS[0],
      TEMPLATE_IDS[1],
      TEMPLATE_IDS[2],
      OWNER_ID,
      'Normalization Template A',
      'Normalization Template B',
      'Normalization Template C',
    ],
  );

  for (const [index, exerciseId] of EXERCISE_IDS.entries()) {
    await client.query(
      `
        INSERT INTO exercises (id, owner_id, name, description, source, deleted_at)
        VALUES ($1, $2, $3, NULL, 'CUSTOM', NULL)
      `,
      [exerciseId, OWNER_ID, `Exercise ${index + 1}`],
    );
  }

  await client.query(
    `
      INSERT INTO template_items (id, template_id, exercise_id, sort_order, note)
      VALUES
        ($1, $6, $7, 5, NULL),
        ($2, $6, $8, 2, NULL),
        ($3, $6, $9, 2, NULL),
        ($4, $10, $11, 8, NULL),
        ($5, $10, $12, 8, NULL)
    `,
    [
      ITEM_IDS[0],
      ITEM_IDS[1],
      ITEM_IDS[2],
      ITEM_IDS[3],
      ITEM_IDS[4],
      TEMPLATE_IDS[0],
      EXERCISE_IDS[0],
      EXERCISE_IDS[1],
      EXERCISE_IDS[2],
      TEMPLATE_IDS[1],
      EXERCISE_IDS[3],
      EXERCISE_IDS[4],
    ],
  );
}

async function assertNormalizedSortOrder(client: pg.Client) {
  const result = await client.query<{
    template_id: string;
    exercise_id: string;
    sort_order: number;
  }>(
    `
      SELECT template_id, exercise_id, sort_order
      FROM template_items
      ORDER BY template_id ASC, sort_order ASC, id ASC
    `,
  );

  assert.deepEqual(
    result.rows
      .filter((row) => row.template_id === TEMPLATE_IDS[0])
      .map((row) => row.sort_order),
    [0, 1, 2],
    'migration should rewrite dirty sortOrder values into a contiguous sequence per template',
  );

  assert.deepEqual(
    result.rows
      .filter((row) => row.template_id === TEMPLATE_IDS[0])
      .map((row) => row.exercise_id),
    [EXERCISE_IDS[1], EXERCISE_IDS[2], EXERCISE_IDS[0]],
    'migration should preserve deterministic ordering for template A by sort_order then id',
  );

  assert.deepEqual(
    result.rows
      .filter((row) => row.template_id === TEMPLATE_IDS[1])
      .map((row) => row.sort_order),
    [0, 1],
    'migration should normalize each template independently instead of across the whole table',
  );

  assert.deepEqual(
    result.rows
      .filter((row) => row.template_id === TEMPLATE_IDS[1])
      .map((row) => row.exercise_id),
    [EXERCISE_IDS[3], EXERCISE_IDS[4]],
    'migration should preserve deterministic ordering for template B by sort_order then id',
  );
}

async function assertUniqueConstraintExists(client: pg.Client) {
  await assert.rejects(
    () =>
      client.query(
        `
          INSERT INTO template_items (template_id, exercise_id, sort_order, note)
          VALUES ($1, $2, 1, NULL)
        `,
        [TEMPLATE_IDS[0], EXERCISE_IDS[0]],
      ),
    (error: unknown) =>
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'constraint' in error &&
      error.code === '23505' &&
      error.constraint === 'template_items_template_id_sort_order_unique',
    'migration should enforce a unique constraint on (template_id, sort_order)',
  );

  await client.query(
    `
      INSERT INTO template_items (template_id, exercise_id, sort_order, note)
      VALUES ($1, $2, 1, NULL)
    `,
    [TEMPLATE_IDS[2], EXERCISE_IDS[0]],
  );
}

await main();
