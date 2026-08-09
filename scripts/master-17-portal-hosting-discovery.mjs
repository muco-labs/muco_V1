#!/usr/bin/env node
/**
 * MASTER 17 — portal hosting discovery (no secret values).
 * Usage: node scripts/master-17-portal-hosting-discovery.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const HOSTS = {
  publicWww: 'https://www.mucolabs.com',
  publicApex: 'https://mucolabs.com',
  staging: 'https://muco-v1.vercel.app',
  portals: [
    'https://app.mucolabs.com',
    'https://team.mucolabs.com',
    'https://freelancers.mucolabs.com',
    'https://admin.mucolabs.com',
  ],
}

const PUBLIC_PATHS = ['/', '/about', '/services', '/contact', '/careers', '/insights', '/pricing']

function loadEnvPresence() {
  const keys = [
    'DATABASE_URL',
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_SUPABASE_ANON_KEY',
    'CORS_ORIGINS',
    'VITE_SITE_URL',
    'VITE_PORTAL_ORIGIN_CUSTOMER',
    'VITE_AUTH_REDIRECT_URL',
    'RAZORPAY_KEY_ID',
    'RESEND_API_KEY',
    'VITE_GA_MEASUREMENT_ID',
  ]
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
  const presence = {}
  for (const k of keys) {
    presence[k] = Boolean(env[k]?.trim())
  }
  return presence
}

async function probeUrl(url, { method = 'GET', follow = false } = {}) {
  try {
    const res = await fetch(url, {
      method: method === 'HEAD' ? 'HEAD' : 'GET',
      redirect: follow ? 'follow' : 'manual',
      signal: AbortSignal.timeout(20_000),
    })
    const out = {
      url,
      status: res.status,
      server: res.headers.get('server') ?? null,
      location: res.headers.get('location') ?? null,
      vercelId: res.headers.get('x-vercel-id') ?? null,
    }
    if (method === 'GET' && res.ok && url.endsWith('/robots.txt')) {
      const text = await res.text()
      out.robotsSitemapLine = text.split('\n').find((l) => l.startsWith('Sitemap:')) ?? null
    }
    if (method === 'GET' && url.includes('/api/health')) {
      const text = await res.text()
      out.healthDatabaseConnected = /"database":"connected"/.test(text)
      out.healthOk = /"status":"ok"/.test(text)
    }
    return out
  } catch (e) {
    return { url, error: e?.message ?? 'FAILED' }
  }
}

async function probePublicPaths(base) {
  const results = []
  for (const p of PUBLIC_PATHS) {
    const r = await probeUrl(`${base}${p}`, { method: 'HEAD', follow: true })
    results.push({ path: p, status: r.status ?? null, error: r.error ?? null })
  }
  return results
}

let vercelLink = null
if (existsSync('.vercel/project.json')) {
  try {
    const j = JSON.parse(readFileSync('.vercel/project.json', 'utf8'))
    vercelLink = { projectName: j.projectName ?? null, projectId: j.projectId ?? null }
  } catch {
    vercelLink = { parseError: true }
  }
}

const report = {
  generatedAt: new Date().toISOString(),
  master: 'MASTER-17',
  repository: {
    vercelProjectLink: vercelLink,
    note: 'Vercel CLI not required; link from .vercel/project.json when present',
  },
  envPresenceLocal: loadEnvPresence(),
  probes: {},
}

report.probes.apex = await probeUrl(HOSTS.publicApex, { method: 'HEAD' })
report.probes.wwwHome = await probeUrl(`${HOSTS.publicWww}/`, { method: 'HEAD', follow: true })
report.probes.wwwHealth = await probeUrl(`${HOSTS.publicWww}/api/health`)
report.probes.stagingHealth = await probeUrl(`${HOSTS.staging}/api/health`)
report.probes.wwwRobots = await probeUrl(`${HOSTS.publicWww}/robots.txt`)
report.probes.stagingRobots = await probeUrl(`${HOSTS.staging}/robots.txt`)
report.probes.publicPathSmoke = await probePublicPaths(HOSTS.publicWww)
report.probes.portalHosts = []
for (const origin of HOSTS.portals) {
  report.probes.portalHosts.push(await probeUrl(`${origin}/`, { method: 'HEAD', follow: true }))
}

report.summary = {
  publicWwwReachable: report.probes.wwwHome.status === 200,
  publicApiHealthy: Boolean(report.probes.wwwHealth.healthOk),
  apexRedirectsToWww: report.probes.apex.status === 308 || report.probes.apex.status === 301,
  portalDnsConfigured: report.probes.portalHosts.every((p) => !p.error && p.status),
  portalDnsConfiguredNote:
    'false when subdomains do not resolve or return errors — expected until DNS + Vercel domain attach',
}

writeFileSync('src/docs/master-17-hosting-probe.json', `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify(report, null, 2))
console.error('\nWrote src/docs/master-17-hosting-probe.json')
