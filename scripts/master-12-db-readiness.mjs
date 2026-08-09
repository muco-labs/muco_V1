/**
 * MASTER 12 — database readiness (never logs connection strings).
 * Usage: node scripts/master-12-db-readiness.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import postgres from 'postgres'

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim()
  if (!existsSync('.env.local')) return null
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    if (line.startsWith('DATABASE_URL=')) {
      let v = line.slice('DATABASE_URL='.length).trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1)
      }
      return v
    }
  }
  return null
}

const migrationFiles = readdirSync('server/db/migrations').filter((f) => f.endsWith('.sql')).length

const url = loadDatabaseUrl()
if (!url) {
  console.log('DATABASE_URL: MISSING')
  console.log('connection: BLOCKED')
  process.exit(0)
}

console.log('DATABASE_URL: PRESENT')
console.log(`migration_sql_files: ${migrationFiles}`)

const sql = postgres(url, { max: 1, connect_timeout: 8 })

try {
  const rows = await sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at`
  console.log(`drizzle_journal_rows: ${rows.length}`)
  console.log('connection: CONNECTED')

  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name IN ('users','payments','proposals','audit_logs')
    ORDER BY table_name
  `
  console.log(`core_commercial_tables_found: ${tables.length}/4`)

  if (rows.length < migrationFiles) {
    console.log('journal_vs_files: BEHIND (journal has fewer entries than sql files)')
  } else if (rows.length > migrationFiles) {
    console.log('journal_vs_files: AHEAD_OR_MANUAL')
  } else {
    console.log('journal_vs_files: ALIGNED_COUNT')
  }
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error)
  if (/42P01|does not exist/i.test(msg)) {
    console.log('connection: CONNECTED')
    console.log('drizzle_journal_rows: 0 (schema may be pre-existing without journal)')
    console.log('journal_vs_files: UNKNOWN')
  } else {
    console.log('connection: FAILED')
    console.log(`error_class: ${error instanceof Error ? error.name : 'Error'}`)
  }
} finally {
  await sql.end({ timeout: 3 })
}
