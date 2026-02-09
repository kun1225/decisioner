import 'dotenv/config'

import { drizzle } from 'drizzle-orm/node-postgres'

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('Drizzle: DATABASE_URL is not defined')
}

export const db = drizzle(DATABASE_URL)
export * from './schema'
