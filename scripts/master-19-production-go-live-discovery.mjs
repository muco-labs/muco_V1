#!/usr/bin/env node
/**
 * MASTER 19 — production portal, auth, and OAuth discovery (no secret values).
 * Usage: node scripts/master-19-production-go-live-discovery.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'

const HOSTS = {
  publicWww: 'https://www.mucolabs.com',
  publicApex: 'https://mucolabs.com',
  portals: {
    customer: 'https://app.mucolabs.com',
    employee: 'https://team.mucolabs.com',
    freelancer: 'https://freelancers.mucolabs.com',
    admin: 'https://admin.mucolabs.com',
  },
}

const ENV_KEYS = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_SITE_URL',
  'VITE_AUTH_REDIRECT_URL',
  'CORS_ORIGINS',
  'FOUNDER_BOOTSTRAP_SECRET',
  'AUTH_REDIRECT_URL',
  'AUTH_INVITE_REDIRECT_URL',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
]

function loadEnv() {
  const env = { ...process.env }
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue
      const i = line.indexOf('=')
      if (i < 0) continue
      env[line.slice(0, i).trim()] = line.slice(i + 1).trim()
    }
  }
  return env
}

function classify(key, env) {
  const v = env[key]?.trim()
  if (!v) return 'MISSING'
  return 'PRESENT'
}

async function probe(url, { follow = false } = {}) {
  try {
    const res = await fetch(url, {
      redirect: follow ? 'follow' : 'manual',
      signal: AbortSignal.timeout(25_000),
    })
    const out = {
      url,
      status: res.status,
      server: res.headers.get('server'),
      location: res.headers.get('location'),
      vercelId: res.headers.get('x-vercel-id'),
      tls: url.startsWith('https://') ? 'HTTPS' : 'HTTP',
    }
    if (res.ok && url.endsWith('/')) {
      const html = await res.text()
      out.title = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? null
      out.hasSignInRoute = /\/auth\/sign-in|Sign in/i.test(html)
      out.isSpaShell = /id="root"/.test(html)
    }
    return out
  } catch (e) {
    return { url, error: e?.message ?? 'FAILED', dnsOrNetwork: 'BLOCKED' }
  }
}

function migrationInventory() {
  const sqlFiles = readdirSync('server/db/migrations').filter((f) => f.endsWith('.sql'))
  const journal = JSON.parse(
    readFileSync('server/db/migrations/meta/_journal.json', 'utf8'),
  )
  const has0029 = sqlFiles.includes('0029_muco_login_id.sql')
  const migration0029 = has0029
    ? readFileSync('server/db/migrations/0029_muco_login_id.sql', 'utf8')
    : ''
  return {
    sqlMigrationCount: sqlFiles.length,
    journalEntryCount: journal.entries?.length ?? 0,
    has0029_muco_login_id: has0029,
    migration0029AddsColumn: migration0029.includes('muco_login_id'),
    drizzleJournalTags: journal.entries?.map((e) => e.tag) ?? [],
    productionSchemaCheck: 'BLOCKED — requires read-only SQL against production (not run in MASTER 19)',
    safeDbMigrate: 'DO NOT RUN npm run db:migrate without reconciling __drizzle_migrations',
  }
}

const env = loadEnv()
const envMatrix = Object.fromEntries(ENV_KEYS.map((k) => [k, classify(k, env)]))

let vercelLink = null
if (existsSync('.vercel/project.json')) {
  try {
    vercelLink = JSON.parse(readFileSync('.vercel/project.json', 'utf8'))
  } catch {
    vercelLink = { parseError: true }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  master: 'MASTER-19',
  vercelProjectLink: vercelLink
    ? { projectName: vercelLink.projectName, projectId: vercelLink.projectId }
    : null,
  envMatrixLocal: envMatrix,
  migrations: migrationInventory(),
  dnsAndHttps: {},
  seo: {},
  oauth: {
    google: envMatrix.GOOGLE_CLIENT_ID === 'PRESENT' ? 'PRESENT (env only — login not tested)' : 'BLOCKED',
    github: envMatrix.GITHUB_CLIENT_ID === 'PRESENT' ? 'PRESENT (env only — login not tested)' : 'BLOCKED',
    supabaseDashboard: 'BLOCKED — requires Supabase project dashboard access',
  },
  browserQa: 'BLOCKED — no dedicated test credentials supplied for MASTER 19',
}

report.dnsAndHttps.apex = await probe(HOSTS.publicApex)
report.dnsAndHttps.www = await probe(`${HOSTS.publicWww}/`, { follow: true })
for (const [portal, base] of Object.entries(HOSTS.portals)) {
  report.dnsAndHttps[portal] = await probe(`${base}/`, { follow: true })
}

report.dnsAndHttps.wwwHealth = await probe(`${HOSTS.publicWww}/api/health`)
report.seo.robots = await probe(`${HOSTS.publicWww}/robots.txt`)
const sitemapRes = await fetch(`${HOSTS.publicWww}/sitemap.xml`, {
  signal: AbortSignal.timeout(25_000),
}).catch(() => null)
if (sitemapRes?.ok) {
  const xml = await sitemapRes.text()
  report.seo.sitemapHasVercelApp = /muco-v1\.vercel\.app/i.test(xml)
  report.seo.sitemapHasWww = /https:\/\/www\.mucolabs\.com/i.test(xml)
} else {
  report.seo.sitemapFetch = 'BLOCKED or FAILED'
}

writeFileSync('src/docs/master-19-go-live-probe.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
