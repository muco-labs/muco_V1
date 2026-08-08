import { drizzle } from 'drizzle-orm/postgres-js'
import { sql } from 'drizzle-orm'
import postgres from 'postgres'
import { isDatabaseConfigured, serverEnv } from '../lib/env.js'
import * as schema from './schema.js'

let client: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!isDatabaseConfigured()) {
    return null
  }
  if (!client || !db) {
    client = postgres(serverEnv.databaseUrl!, { max: 1 })
    db = drizzle(client, { schema })
  }
  return db
}

export async function checkDatabaseConnection(): Promise<'connected' | 'unconfigured' | 'error'> {
  if (!isDatabaseConfigured()) {
    return 'unconfigured'
  }
  try {
    const connection = getDb()
    if (!connection) return 'unconfigured'
    await connection.execute(sql`select 1`)
    return 'connected'
  } catch {
    return 'error'
  }
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.end({ timeout: 5 })
    client = null
    db = null
  }
}

export { schema }
