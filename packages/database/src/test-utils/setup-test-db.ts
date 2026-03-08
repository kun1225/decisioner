import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const TEST_DB_NAME = 'joygym_test';
const BASE_URL = 'postgresql://joygym:joygym@localhost:5432';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsFolder = resolve(__dirname, '../../drizzle');

let testDb: ReturnType<typeof drizzle> | null = null;
let pool: pg.Pool | null = null;

export async function setupTestDb(): Promise<void> {
  const client = new pg.Client({ connectionString: `${BASE_URL}/postgres` });

  await retryConnect(client);

  const result = await client.query(
    `SELECT 1 FROM pg_database WHERE datname = $1`,
    [TEST_DB_NAME],
  );
  if (result.rowCount === 0) {
    await client.query(`CREATE DATABASE ${TEST_DB_NAME}`);
  }
  await client.end();

  pool = new pg.Pool({ connectionString: `${BASE_URL}/${TEST_DB_NAME}` });
  testDb = drizzle(pool);

  await migrate(testDb, { migrationsFolder });
}

export async function truncateTables(): Promise<void> {
  if (!testDb) throw new Error('Test DB not initialized');

  const result = await testDb.execute<{ tablename: string }>(
    sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename NOT LIKE 'drizzle_%'`,
  );

  if (result.rows.length > 0) {
    const tableNames = result.rows.map((r) => `"${r.tablename}"`).join(', ');
    await testDb.execute(
      sql.raw(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`),
    );
  }
}

export async function closeTestDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    testDb = null;
  }
}

async function retryConnect(
  client: pg.Client,
  maxRetries = 5,
  delayMs = 500,
): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await client.connect();
      return;
    } catch {
      if (i === maxRetries - 1) throw new Error('Cannot connect to PostgreSQL');
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}
