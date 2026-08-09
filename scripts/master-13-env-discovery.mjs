/**
 * MASTER 13 — environment discovery (never prints secret values).
 * Usage: node scripts/master-13-env-discovery.mjs
 */
import { existsSync, readFileSync } from 'node:fs'

const KEYS = [
  ['DATABASE_URL', 'REQUIRED'],
  ['POSTGRES_URL', 'OPTIONAL_ALT'],
  ['POSTGRES_PRISMA_URL', 'OPTIONAL_ALT'],
  ['SUPABASE_URL', 'REQUIRED'],
  ['SUPABASE_ANON_KEY', 'OPTIONAL_SERVER'],
  ['SUPABASE_SERVICE_ROLE_KEY', 'REQUIRED'],
  ['SUPABASE_JWT_SECRET', 'OPTIONAL'],
  ['VITE_SUPABASE_URL', 'REQUIRED_CLIENT'],
  ['VITE_SUPABASE_ANON_KEY', 'OPTIONAL_CLIENT'],
  ['VITE_SUPABASE_PUBLISHABLE_KEY', 'OPTIONAL_CLIENT'],
  ['VITE_SITE_URL', 'REQUIRED_CLIENT'],
  ['VITE_APP_URL', 'OPTIONAL_CLIENT'],
  ['VITE_AUTH_REDIRECT_URL', 'OPTIONAL_CLIENT'],
  ['VITE_API_BASE_URL', 'OPTIONAL_CLIENT'],
  ['VITE_GA_MEASUREMENT_ID', 'OPTIONAL_CLIENT'],
  ['VITE_GSC_VERIFICATION', 'OPTIONAL_CLIENT'],
  ['AUTH_REDIRECT_URL', 'REQUIRED_PROD'],
  ['AUTH_INVITE_REDIRECT_URL', 'OPTIONAL'],
  ['AUTH_SECRET', 'OPTIONAL'],
  ['FOUNDER_BOOTSTRAP_SECRET', 'REQUIRED_BOOTSTRAP'],
  ['CORS_ORIGINS', 'OPTIONAL'],
  ['RAZORPAY_KEY_ID', 'REQUIRED_PAYMENTS'],
  ['RAZORPAY_KEY_SECRET', 'REQUIRED_PAYMENTS'],
  ['RAZORPAY_WEBHOOK_SECRET', 'REQUIRED_WEBHOOKS'],
  ['SUPABASE_STORAGE_BUCKET', 'OPTIONAL_DEFAULT'],
  ['RESEND_API_KEY', 'OPTIONAL'],
  ['RESEND_FROM_EMAIL', 'OPTIONAL'],
  ['NVIDIA_API_KEY', 'OPTIONAL'],
  ['NVIDIA_API_BASE_URL', 'OPTIONAL'],
  ['NVIDIA_MODEL', 'OPTIONAL'],
  ['PAGESPEED_INSIGHTS_API_KEY', 'OPTIONAL'],
  ['VERCEL_OIDC_TOKEN', 'LOCAL_CLI_ONLY'],
]

const VITE_SECRET_FORBIDDEN = [
  'VITE_SUPABASE_SERVICE_ROLE_KEY',
  'VITE_DATABASE_URL',
  'VITE_RAZORPAY_KEY_SECRET',
  'VITE_NVIDIA_API_KEY',
  'VITE_AUTH_SECRET',
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
  if (/\[SENSITIVE\]|^your_|CHANGE_ME|placeholder/i.test(String(value))) return 'INVALID'
  if (String(value).length < 4) return 'INVALID'
  return 'PRESENT'
}

const local = loadEnvFile('.env.local')
const dotEnv = loadEnvFile('.env')
const merged = { ...dotEnv, ...local, ...process.env }

console.log('MASTER 13 — environment discovery\n')
for (const file of [
  '.env',
  '.env.local',
  '.env.example',
  '.env.mucolabs.prod',
  '.env.webpage.prod',
]) {
  console.log(`file ${file}: ${existsSync(file) ? 'EXISTS' : 'MISSING'}`)
}

console.log('\n--- LOCAL (merged .env + .env.local + process) ---')
for (const [k, tier] of KEYS) {
  console.log(`${k}: ${classify(merged[k])} (${tier})`)
}

const dbUrl =
  classify(merged.DATABASE_URL) === 'PRESENT' ||
  classify(merged.POSTGRES_URL) === 'PRESENT' ||
  classify(merged.POSTGRES_PRISMA_URL) === 'PRESENT'
const supabaseClient =
  classify(merged.VITE_SUPABASE_URL) === 'PRESENT' &&
  (classify(merged.VITE_SUPABASE_ANON_KEY) === 'PRESENT' ||
    classify(merged.VITE_SUPABASE_PUBLISHABLE_KEY) === 'PRESENT')
const supabaseServer =
  classify(merged.SUPABASE_URL) === 'PRESENT' &&
  classify(merged.SUPABASE_SERVICE_ROLE_KEY) === 'PRESENT'
const razorpay =
  classify(merged.RAZORPAY_KEY_ID) === 'PRESENT' &&
  classify(merged.RAZORPAY_KEY_SECRET) === 'PRESENT'

console.log(`\ndatabase_configured: ${dbUrl ? 'YES' : 'NO'}`)
console.log(`supabase_client_configured: ${supabaseClient ? 'YES' : 'NO'}`)
console.log(`supabase_server_configured: ${supabaseServer ? 'YES' : 'NO'}`)
console.log(`razorpay_credentials: ${razorpay ? 'PRESENT' : 'MISSING'}`)
console.log(`razorpay_webhook: ${classify(merged.RAZORPAY_WEBHOOK_SECRET)}`)
console.log(`nvidia: ${classify(merged.NVIDIA_API_KEY)}`)
console.log(`storage_bucket_env: ${classify(merged.SUPABASE_STORAGE_BUCKET) || 'DEFAULT customer-files'}`)

console.log('\n--- VITE secret prefix audit (must be MISSING in env files) ---')
for (const k of VITE_SECRET_FORBIDDEN) {
  console.log(`${k}: ${classify(merged[k])}`)
}

console.log('\nvercel_env_matrix: BLOCKED (CLI/dashboard not audited in this script; run vercel env ls --project muco-v1)')
