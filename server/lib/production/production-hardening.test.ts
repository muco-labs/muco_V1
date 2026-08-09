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

describe('production hardening — vercel headers', () => {
  it('keeps vercel.json CSP aligned with Razorpay checkout', () => {
    const vercel = JSON.parse(readFileSync(join(repoRoot, 'vercel.json'), 'utf8')) as {
      headers?: Array<{ headers?: Array<{ key: string; value: string }> }>
    }
    const csp = vercel.headers
      ?.flatMap((block) => block.headers ?? [])
      .find((h) => h.key === 'Content-Security-Policy')?.value
    expect(csp).toContain('https://checkout.razorpay.com')
    expect(csp).toContain('frame-src')
  })
})
