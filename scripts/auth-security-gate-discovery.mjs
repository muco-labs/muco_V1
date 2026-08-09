/**
 * MASTER 04.1 — environment discovery (never prints secret values).
 * Usage: node scripts/auth-security-gate-discovery.mjs
 */
import { existsSync, readFileSync } from 'node:fs'

const AUTH_KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'SUPABASE_JWT_SECRET',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'AUTH_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'SECURITY_GATE_RUN',
  'SECURITY_GATE_BEARER_CUSTOMER_A',
]

function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    let v = line.slice(i + 1).trim()
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1)
    }
    out[line.slice(0, i).trim()] = v
  }
  return out
}

function classify(value) {
  if (value === undefined || String(value).trim() === '') return 'MISSING'
  if (/\[SENSITIVE\]|^your_|CHANGE_ME|placeholder/i.test(String(value))) return 'UNAVAILABLE'
  if (String(value).length < 12) return 'UNAVAILABLE'
  return 'CONFIGURED'
}

const local = loadEnvFile('.env.local')
const merged = { ...local, ...process.env }

console.log('MASTER 04.1 — auth environment discovery\n')
for (const file of ['.env.local', '.env.mucolabs.prod', '.env.webpage.prod']) {
  console.log(`${file}: ${existsSync(file) ? 'EXISTS' : 'MISSING'}`)
}

let configuredCount = 0
for (const k of AUTH_KEYS) {
  const status = classify(merged[k])
  if (status === 'CONFIGURED') configuredCount += 1
  console.log(`${k}: ${status}`)
}

const liveGateReady =
  merged.SECURITY_GATE_RUN === '1' && classify(merged.SECURITY_GATE_BEARER_CUSTOMER_A) === 'CONFIGURED'

console.log(`\nAuthenticated gate (SECURITY_GATE_RUN=1 + bearer tokens): ${liveGateReady ? 'READY' : 'BLOCKED'}`)
console.log(`Core DB+Supabase for login: ${configuredCount >= 4 ? 'PARTIAL/UNKNOWN' : 'BLOCKED'}`)
