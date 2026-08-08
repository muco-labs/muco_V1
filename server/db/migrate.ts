import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { serverEnv } from '../lib/env.js'

async function main() {
  if (!serverEnv.databaseUrl) {
    console.error('DATABASE_URL is not set. Cannot run migrations.')
    process.exit(1)
  }

  const migrationClient = postgres(serverEnv.databaseUrl, { max: 1 })
  const db = drizzle(migrationClient)

  await migrate(db, { migrationsFolder: './server/db/migrations' })
  await migrationClient.end({ timeout: 5 })

  console.log('Migrations applied successfully.')
}

main().catch((error) => {
  console.error('Migration failed.')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
