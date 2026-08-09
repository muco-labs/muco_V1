import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export function migrationSqlFromFile(filePath) {
  const raw = readFileSync(filePath, 'utf8')
  const parts = raw
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter(Boolean)
  return parts.map((p) => (p.endsWith(';') ? p : `${p};`)).join('\n')
}

const file = process.argv[2]
if (!file) {
  console.error('Usage: node scripts/drizzle-migration-sql.mjs <migration-file.sql>')
  process.exit(1)
}

process.stdout.write(migrationSqlFromFile(join(process.cwd(), 'server/db/migrations', file)))
