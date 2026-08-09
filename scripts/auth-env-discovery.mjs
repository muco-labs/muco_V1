import { existsSync, readFileSync } from 'node:fs'

const KEYS = [
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
  'RAZORPAY_WEBHOOK_SECRET',
  'FOUNDER_BOOTSTRAP_SECRET',
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

const files = ['.env.local', '.env.mucolabs.prod', '.env.webpage.prod', '.env.example']
for (const f of files) {
  console.log(`FILE ${f}: ${existsSync(f) ? 'EXISTS' : 'MISSING'}`)
}

const merged = {}
for (const f of ['.env.example', '.env.local']) {
  Object.assign(merged, loadEnvFile(f))
}

for (const k of KEYS) {
  const val = process.env[k] ?? merged[k]
  const status =
    val !== undefined && String(val).trim().length > 0 ? 'CONFIGURED' : 'MISSING'
  console.log(`${k}: ${status}`)
}
