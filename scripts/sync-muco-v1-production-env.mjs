/**
 * Push non-masked production env vars from mucolabs pull → muco-v1 (Production only).
 * Secrets masked as [SENSITIVE] by `vercel env pull` are skipped (operator must add in dashboard).
 */
import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const SOURCE = '.env.mucolabs.prod'
const SCOPE = 'muco-labs'
const PROJECT = 'muco-v1'
const TARGET_ENV = 'production'

function loadEnv(path) {
  const out = {}
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue
    const i = line.indexOf('=')
    if (i < 0) continue
    let v = line.slice(i + 1)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[line.slice(0, i)] = v
  }
  return out
}

function isUsable(value) {
  return Boolean(value && !value.includes('[SENSITIVE]'))
}

function addEnv(name, value) {
  const result = spawnSync(
    'npx',
    ['vercel', 'env', 'add', name, TARGET_ENV, '--scope', SCOPE, '--project', PROJECT, '--force'],
    {
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      cwd: process.cwd(),
    },
  )
  if (result.status !== 0) {
    const err = (result.stderr || result.stdout || '').trim()
    if (err.includes('already exists')) {
      console.log(`skip ${name} (exists)`)
      return
    }
    console.error(`fail ${name}: ${err.split('\n')[0]}`)
    return
  }
  console.log(`ok ${name}`)
}

if (!existsSync(SOURCE)) {
  console.error(`Missing ${SOURCE}. Run: vercel env pull ${SOURCE} --environment production --project mucolabs`)
  process.exit(1)
}

const src = loadEnv(SOURCE)

const mappings = [
  ['SUPABASE_URL', 'SUPABASE_URL'],
  ['VITE_SUPABASE_URL', 'SUPABASE_URL'],
  ['VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  ['VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_PUBLISHABLE_KEY'],
  ['SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
]

// Production marketing canonical (www)
const staticVars = {
  VITE_SITE_URL: 'https://www.mucolabs.com',
  VITE_AUTH_REDIRECT_URL: 'https://www.mucolabs.com',
  AUTH_REDIRECT_URL: 'https://www.mucolabs.com',
  SUPABASE_STORAGE_BUCKET: 'customer-files',
  VITE_FIREBASE_API_KEY: 'AIzaSyAHkJnwCRbtbm2ak1Qv8cNy8eShx4EGG7A',
  VITE_FIREBASE_AUTH_DOMAIN: 'muco-labs.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'muco-labs',
  VITE_FIREBASE_APP_ID: '1:979380201939:web:9b118436601db819f1a726',
}

console.log('Syncing muco-v1 production env (names only in log)...')

for (const [target, sourceKey] of mappings) {
  const value = src[sourceKey]
  if (!isUsable(value)) {
    console.log(`skip ${target} (source ${sourceKey} masked or missing)`)
    continue
  }
  addEnv(target, value)
}

for (const [name, value] of Object.entries(staticVars)) {
  addEnv(name, value)
}

console.log('\nOperator must still add (Production, muco-v1):')
console.log('- DATABASE_URL (use Supabase pooler URI from dashboard or copy POSTGRES_URL from mucolabs)')
console.log('- SUPABASE_SERVICE_ROLE_KEY')
console.log('- SUPABASE_JWT_SECRET (optional; JWT verified via service role)')
console.log('- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET (sandbox)')
console.log('- RESEND_API_KEY, RESEND_FROM_EMAIL (optional)')
console.log('- FOUNDER_BOOTSTRAP_SECRET (operator-generated)')
console.log('- NVIDIA_API_KEY (optional)')
