/**
 * MASTER 13 — schema inventory + light integrity (no connection strings logged).
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

const FOCUS_TABLES = [
  'users',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'customer_profiles',
  'leads',
  'proposals',
  'payments',
  'invoices',
  'projects',
  'tasks',
  'files',
  'notifications',
  'messages',
  'customer_conversations',
  'customer_conversation_messages',
  'audit_logs',
]

const url = loadDatabaseUrl()
if (!url) {
  console.log('schema_inventory: BLOCKED (DATABASE_URL missing)')
  process.exit(0)
}

const sql = postgres(url, { max: 1, connect_timeout: 10 })
const t0 = Date.now()

try {
  const [{ count: tableCount }] = await sql`
    SELECT count(*)::int as count FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `
  const [{ count: enumCount }] = await sql`
    SELECT count(*)::int as count FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typtype = 'e'
  `
  const [{ count: fkCount }] = await sql`
    SELECT count(*)::int as count FROM information_schema.table_constraints
    WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'
  `
  const [{ count: indexCount }] = await sql`
    SELECT count(*)::int as count FROM pg_indexes WHERE schemaname = 'public'
  `
  const rls = await sql`
    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true
  `

  console.log('schema_inventory: CONNECTED')
  console.log(`probe_ms: ${Date.now() - t0}`)
  console.log(`public_tables: ${tableCount}`)
  console.log(`public_enums: ${enumCount}`)
  console.log(`foreign_keys: ${fkCount}`)
  console.log(`indexes: ${indexCount}`)
  console.log(`rls_enabled_tables: ${rls.length}`)

  const present = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ANY(${FOCUS_TABLES})
    ORDER BY table_name
  `
  const found = new Set(present.map((r) => r.table_name))
  console.log(`focus_tables: ${found.size}/${FOCUS_TABLES.length}`)
  for (const t of FOCUS_TABLES) {
    console.log(`  ${t}: ${found.has(t) ? 'EXISTS' : 'MISSING'}`)
  }

  const journal = await sql`
    SELECT count(*)::int as c FROM drizzle.__drizzle_migrations
  `.catch(() => [{ c: null }])
  console.log(`drizzle_journal_rows: ${journal[0]?.c ?? 'NO_TABLE'}`)

  const migrationFiles = readdirSync('server/db/migrations').filter((f) => f.endsWith('.sql')).length
  console.log(`migration_sql_files: ${migrationFiles}`)

  // Light integrity probes (counts only)
  const orphans = []
  const probes = [
    {
      name: 'payments_proposal_id_orphan',
      q: sql`
        SELECT count(*)::int as c FROM payments p
        WHERE p.proposal_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM proposals pr WHERE pr.id = p.proposal_id)
      `,
    },
    {
      name: 'files_project_id_orphan',
      q: sql`
        SELECT count(*)::int as c FROM files f
        WHERE f.project_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM projects pr WHERE pr.id = f.project_id)
      `,
    },
    {
      name: 'customer_profiles_user_orphan',
      q: sql`
        SELECT count(*)::int as c FROM customer_profiles cp
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = cp.user_id)
      `,
    },
  ]

  for (const p of probes) {
    try {
      const [{ c }] = await p.q
      orphans.push(`${p.name}: ${c}`)
    } catch {
      orphans.push(`${p.name}: SKIPPED`)
    }
  }
  console.log('integrity_orphan_counts:')
  for (const line of orphans) console.log(`  ${line}`)
} catch (error) {
  const msg = error instanceof Error ? error.message : String(error)
  console.log('schema_inventory: FAILED')
  console.log(`error_class: ${error instanceof Error ? error.name : 'Error'}`)
  console.log(`error_hint: ${msg.slice(0, 120)}`)
} finally {
  await sql.end({ timeout: 3 })
}
