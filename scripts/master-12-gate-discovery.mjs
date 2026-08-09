/**
 * MASTER 12 — environment readiness (never prints secret values).
 * Usage: node scripts/master-12-gate-discovery.mjs
 */
import { existsSync, readFileSync } from 'node:fs'

const KEYS = [
  'DATABASE_URL',
  'POSTGRES_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'AUTH_SECRET',
  'FOUNDER_BOOTSTRAP_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SUPABASE_STORAGE_BUCKET',
  'NVIDIA_API_KEY',
  'SECURITY_GATE_RUN',
  'SECURITY_GATE_BEARER_CUSTOMER_A',
  'SECURITY_GATE_BEARER_CUSTOMER_B',
  'SECURITY_GATE_BEARER_EMPLOYEE_A',
  'SECURITY_GATE_BEARER_FREELANCER_A',
  'SECURITY_GATE_BEARER_ADMIN_A',
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
  if (String(value).length < 8) return 'UNAVAILABLE'
  return 'PRESENT'
}

const local = loadEnvFile('.env.local')
const merged = { ...local, ...process.env }

console.log('MASTER 12 — environment readiness\n')
for (const file of ['.env', '.env.local', '.env.example', '.env.mucolabs.prod', '.env.webpage.prod']) {
  console.log(`${file}: ${existsSync(file) ? 'EXISTS' : 'MISSING'}`)
}

console.log('')
for (const k of KEYS) {
  console.log(`${k}: ${classify(merged[k])}`)
}

const matrixReady =
  classify(merged.SECURITY_GATE_BEARER_CUSTOMER_A) === 'PRESENT' &&
  classify(merged.SECURITY_GATE_BEARER_CUSTOMER_B) === 'PRESENT' &&
  merged.SECURITY_GATE_RUN === '1'

console.log(`\nDedicated test-account bearer matrix: ${matrixReady ? 'READY' : 'BLOCKED'}`)
console.log(
  `Razorpay live sandbox gate: ${
    classify(merged.RAZORPAY_KEY_ID) === 'PRESENT' &&
    classify(merged.RAZORPAY_KEY_SECRET) === 'PRESENT'
      ? 'PARTIAL (credentials present; no automated charge in this script)'
      : 'BLOCKED'
  }`,
)
