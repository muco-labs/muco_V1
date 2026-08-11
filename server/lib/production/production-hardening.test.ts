import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationsDir = join(process.cwd(), 'server/db/migrations')
const journalPath = join(migrationsDir, 'meta/_journal.json')
const repoRoot = process.cwd()

describe('production hardening — migration journal', () => {
  it('lists every SQL migration in meta/_journal.json', () => {
    const sqlTags = readdirSync(migrationsDir)
      .filter((name) => name.endsWith('.sql'))
      .map((name) => name.replace(/\.sql$/, ''))
      .sort()

    const journal = JSON.parse(readFileSync(journalPath, 'utf8')) as {
      entries: Array<{ tag: string; idx: number }>
    }
    const journalTags = journal.entries.map((e) => e.tag).sort()

    expect(journalTags).toEqual(sqlTags)

    const indices = journal.entries.map((e) => e.idx)
    expect(indices).toEqual(indices.map((_, i) => i))
  })
})

describe('production hardening — Razorpay CSP', () => {
  it('allows Razorpay checkout script and frames in shared security config', () => {
    const securityTs = readFileSync(join(repoRoot, 'src/config/security.ts'), 'utf8')
    expect(securityTs).toContain('https://checkout.razorpay.com')
    expect(securityTs).toContain('frame-src')
    expect(securityTs).toContain('https://api.razorpay.com')
  })
})

describe('production hardening — Netlify headers', () => {
  it('keeps netlify.toml CSP aligned with Razorpay checkout', () => {
    const toml = readFileSync(join(repoRoot, 'netlify.toml'), 'utf8')
    expect(toml).toContain('https://checkout.razorpay.com')
    expect(toml).toContain('frame-src')
    expect(toml).toContain('Content-Security-Policy')
  })
})
