/**
 * MASTER 13 — compare migration SQL expectations vs live DB (no secrets).
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
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

function parseMigrationSignals(content) {
  const types = [...content.matchAll(/CREATE TYPE "public"\."([^"]+)"/g)].map((m) => m[1])
  const tables = [...content.matchAll(/CREATE TABLE "([^"]+)"/g)].map((m) => m[1])
  const addCols = [...content.matchAll(/ALTER TABLE "([^"]+)" ADD COLUMN "([^"]+)"/g)].map(
    (m) => `${m[1]}.${m[2]}`,
  )
  const altersOnly = /ALTER TABLE/i.test(content) && tables.length === 0 && types.length === 0
  return { types, tables, addCols, altersOnly, hasSql: content.trim().length > 0 }
}

async function main() {
  const url = loadDatabaseUrl()
  if (!url) {
    console.log('migration_reconcile: BLOCKED')
    return
  }

  const files = readdirSync('server/db/migrations')
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const sql = postgres(url, { max: 1, connect_timeout: 10 })

  const existingTables = new Set(
    (await sql`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `).map((r) => r.table_name),
  )

  const existingTypes = new Set(
    (await sql`
      SELECT t.typname as name FROM pg_type t
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typtype = 'e'
    `).map((r) => r.name),
  )

  let journalRows = 0
  try {
    const rows = await sql`SELECT id, hash, created_at FROM drizzle.__drizzle_migrations ORDER BY id`
    journalRows = rows.length
    console.log(`drizzle_journal_rows: ${journalRows}`)
  } catch {
    console.log('drizzle_journal_rows: NO_TABLE_OR_EMPTY')
  }

  console.log(`migration_files: ${files.length}`)
  console.log('\n| Migration | Primary signal | DB state | Action |')
  console.log('|-----------|----------------|----------|--------|')

  let alreadyApplied = 0
  let missing = 0
  let review = 0
  let conflict = 0

  for (const file of files) {
    const tag = file.replace(/\.sql$/, '')
    const raw = await readFile(`server/db/migrations/${file}`, 'utf8')
    const hash = createHash('sha256').update(raw).digest('hex').slice(0, 16)
    const sig = parseMigrationSignals(raw)

    let action = 'REQUIRES REVIEW'
    let state = 'unknown'

    if (!sig.hasSql) {
      action = 'SAFE TO APPLY'
      state = 'empty'
    } else if (sig.tables.length > 0) {
      const allTables = sig.tables.every((t) => existingTables.has(t))
      const anyTable = sig.tables.some((t) => existingTables.has(t))
      state = `${sig.tables.filter((t) => existingTables.has(t)).length}/${sig.tables.length} tables`
      if (allTables && sig.types.every((ty) => existingTypes.has(ty))) {
        action = 'ALREADY APPLIED'
        alreadyApplied++
      } else if (anyTable && !allTables) {
        action = 'CONFLICT'
        conflict++
      } else if (!anyTable) {
        action = 'MISSING'
        missing++
      } else {
        action = 'REQUIRES REVIEW'
        review++
      }
    } else if (sig.types.length > 0) {
      const allTypes = sig.types.every((ty) => existingTypes.has(ty))
      state = `${sig.types.filter((ty) => existingTypes.has(ty)).length}/${sig.types.length} enums`
      action = allTypes ? 'ALREADY APPLIED' : 'MISSING'
      if (allTypes) alreadyApplied++
      else missing++
    } else if (sig.addCols.length > 0) {
      let colsOk = 0
      for (const ref of sig.addCols) {
        const [table, col] = ref.split('.')
        const [{ exists }] = await sql`
          SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = ${table} AND column_name = ${col}
          ) as exists
        `
        if (exists) colsOk++
      }
      state = `${colsOk}/${sig.addCols.length} columns`
      if (colsOk === sig.addCols.length) {
        action = 'ALREADY APPLIED'
        alreadyApplied++
      } else if (colsOk === 0) {
        action = 'MISSING'
        missing++
      } else {
        action = 'CONFLICT'
        conflict++
      }
    } else if (sig.altersOnly) {
      state = 'alter-only'
      action = 'REQUIRES REVIEW'
      review++
    }

    console.log(`| ${tag} | ${hash} | ${state} | ${action} |`)
  }

  console.log(`\nsummary_already_applied: ${alreadyApplied}`)
  console.log(`summary_missing: ${missing}`)
  console.log(`summary_conflict: ${conflict}`)
  console.log(`summary_review: ${review}`)
  console.log(
    `blind_db_migrate: ${
      journalRows === 0 && alreadyApplied > 0 ? 'UNSAFE — baseline journal before migrate' : 'REQUIRES RECONCILE REVIEW'
    }`,
  )

  await sql.end({ timeout: 3 })
}

main().catch((e) => {
  console.log('migration_reconcile: FAILED')
  console.log(e instanceof Error ? e.message.slice(0, 200) : String(e))
})
