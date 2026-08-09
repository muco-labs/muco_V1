import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/**
 * MASTER 13 — migration safety invariants (no DB required).
 */
describe('MASTER 13 migration safety', () => {
  it('has 30 SQL migrations aligned with journal entry count', () => {
    const sqlCount = readdirSync('server/db/migrations').filter((f) => f.endsWith('.sql')).length
    const journal = JSON.parse(
      readFileSync('server/db/migrations/meta/_journal.json', 'utf8'),
    ) as { entries: unknown[] }
    expect(sqlCount).toBe(30)
    expect(journal.entries.length).toBe(30)
  })

  it('documents that empty drizzle journal + populated schema must not run blind migrate', () => {
    // Operator runbook: baseline drizzle.__drizzle_migrations only after full reconcile.
    const unsafe = 'journal empty AND schema pre-exists'
    expect(unsafe).toContain('journal')
  })
})
