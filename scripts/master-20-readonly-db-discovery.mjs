#!/usr/bin/env node
/**
 * MASTER 20 — read-only production DB discovery (no secret values printed).
 */
import { existsSync, readFileSync } from 'node:fs'
import postgres from 'postgres'

function loadDatabaseUrl() {
  const env = { ...process.env }
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue
      const i = line.indexOf('=')
      if (i < 0) continue
      env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return (
    env.DATABASE_URL?.trim() ||
    env.POSTGRES_URL?.trim() ||
    env.POSTGRES_PRISMA_URL?.trim() ||
    ''
  )
}

const url = loadDatabaseUrl()
const out = {
  master: 'MASTER-20-readonly-db',
  generatedAt: new Date().toISOString(),
  databaseUrl: url ? 'PRESENT' : 'MISSING',
  connection: 'NOT_CONNECTED',
  mucoLoginIdColumn: 'BLOCKED',
  mucoLoginIdIndex: 'BLOCKED',
  mucoLoginIdPopulatedCount: 'BLOCKED',
  usersRowCount: 'BLOCKED',
  drizzleMigrationsTable: 'BLOCKED',
  drizzleMigrationCount: 'BLOCKED',
  migration0029Applied: 'BLOCKED',
  error: null,
}

if (!url) {
  console.log(JSON.stringify(out, null, 2))
  process.exit(0)
}

const sql = postgres(url, {
  max: 1,
  connect_timeout: 8,
  idle_timeout: 5,
  ssl: url.includes('sslmode=require') || url.includes('supabase') ? 'require' : undefined,
})

try {
  await sql`select 1 as ok`
  out.connection = 'CONNECTED'

  const [col] = await sql`
    select column_name, data_type, is_nullable
    from information_schema.columns
    where table_schema = 'public' and table_name = 'users' and column_name = 'muco_login_id'
  `
  out.mucoLoginIdColumn = col ? 'PRESENT' : 'MISSING'

  const indexes = await sql`
    select indexname, indexdef
    from pg_indexes
    where schemaname = 'public' and tablename = 'users' and indexdef ilike '%muco_login_id%'
  `
  out.mucoLoginIdIndex = indexes.length > 0 ? 'PRESENT' : 'MISSING'

  if (col) {
    const [{ count }] = await sql`
      select count(*)::int as count from users where muco_login_id is not null
    `
    out.mucoLoginIdPopulatedCount = count
    const [{ total }] = await sql`select count(*)::int as total from users`
    out.usersRowCount = total
  }

  const tables = await sql`
    select table_schema, table_name
    from information_schema.tables
    where table_name like '%drizzle%'
  `
  out.drizzleMigrationsTable =
    tables.length > 0
      ? tables.map((t) => `${t.table_schema}.${t.table_name}`).join(', ')
      : 'MISSING'

  if (tables.some((t) => t.table_name === '__drizzle_migrations')) {
    const rows = await sql`
      select id, hash, created_at from drizzle.__drizzle_migrations order by created_at desc limit 35
    `
    out.drizzleMigrationCount = rows.length
    out.migration0029Applied = rows.some((r) => String(r.hash ?? '').includes('0029') || String(r.id ?? '').includes('0029'))
      ? 'LIKELY'
      : rows.length >= 30
        ? 'UNKNOWN_TAG'
        : 'NOT_DETECTED'
    out.latestMigrationCreatedAt = rows[0]?.created_at ?? null
  }
} catch (e) {
  out.connection = 'NOT_CONNECTED'
  out.error = e?.message?.replace(/postgres:\/\/[^@]+@/gi, 'postgres://***@') ?? 'query failed'
} finally {
  await sql.end({ timeout: 3 }).catch(() => undefined)
}

console.log(JSON.stringify(out, null, 2))
