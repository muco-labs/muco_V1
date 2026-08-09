import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { isDatabaseConfigured, serverEnv } from '../lib/env.js'
import * as schema from './schema.js'

export type DatabaseHealthStatus = 'connected' | 'unconfigured' | 'unavailable'

const HEALTH_PROBE_TIMEOUT_MS = 3_500

/** Shared postgres.js options for Vercel serverless (short connect, single connection). */
function postgresServerlessOptions(connectionString: string) {
  return {
    max: 1,
    connect_timeout: 5,
    idle_timeout: 20,
    max_lifetime: 60 * 10,
    connection: {
      application_name: 'muco-labs-api',
    },
    ssl: connectionString.includes('sslmode=require') ? ('require' as const) : undefined,
  }
}

let client: ReturnType<typeof postgres> | null = null
let db: ReturnType<typeof drizzle<typeof schema>> | null = null

export function getDb() {
  if (!isDatabaseConfigured()) {
    return null
  }
  if (!client || !db) {
    client = postgres(serverEnv.databaseUrl!, postgresServerlessOptions(serverEnv.databaseUrl!))
    db = drizzle(client, { schema })
  }
  return db
}

/**
 * Lightweight connectivity probe for /api/health.
 * Uses a dedicated short-lived client so a bad DATABASE_URL cannot hang the serverless function.
 */
export async function checkDatabaseConnection(): Promise<DatabaseHealthStatus> {
  if (!isDatabaseConfigured()) {
    return 'unconfigured'
  }

  const url = serverEnv.databaseUrl!
  const probeClient = postgres(url, {
    ...postgresServerlessOptions(url),
    max: 1,
    connect_timeout: 3,
    idle_timeout: 1,
    max_lifetime: 5,
  })

  const probe = (async () => {
    try {
      await probeClient`select 1 as ok`
      return 'connected' as const
    } catch {
      return 'unavailable' as const
    } finally {
      await probeClient.end({ timeout: 2 }).catch(() => undefined)
    }
  })()

  const timeout = new Promise<DatabaseHealthStatus>((resolve) => {
    setTimeout(() => resolve('unavailable'), HEALTH_PROBE_TIMEOUT_MS)
  })

  return Promise.race([probe, timeout])
}

export async function closeDatabaseConnection() {
  if (client) {
    await client.end({ timeout: 5 })
    client = null
    db = null
  }
}

export { schema }
