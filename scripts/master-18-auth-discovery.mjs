/**
 * MASTER 18 — authentication inventory discovery (no secret values).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

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
  return 'PRESENT'
}

function walk(dir, acc = []) {
  if (!existsSync(dir)) return acc
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '.git') continue
      walk(p, acc)
    } else if (/auth|Auth|authenticate|ProtectedPortal|post-auth/i.test(name)) {
      acc.push(p.replace(/\\/g, '/'))
    }
  }
  return acc
}

const merged = { ...loadEnvFile('.env.local'), ...process.env }

const envKeys = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_AUTH_REDIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'FOUNDER_BOOTSTRAP_SECRET',
  'AUTH_REDIRECT_URL',
  'AUTH_INVITE_REDIRECT_URL',
  'CORS_ORIGINS',
]

console.log('MASTER 18 — auth environment (values not printed)\n')
for (const k of envKeys) {
  console.log(`${k}: ${classify(merged[k])}`)
}

const authFiles = [
  'server/middleware/authenticate.ts',
  'server/routes/v1/auth.ts',
  'server/services/auth.service.ts',
  'src/contexts/AuthProvider.tsx',
  'src/components/auth/ProtectedPortal.tsx',
  'src/lib/auth/post-auth-destination.ts',
  'src/config/domains/resolve-application-domain.ts',
].filter((f) => existsSync(f))

console.log('\nMASTER 18 — core auth modules')
for (const f of authFiles) console.log(`  OK ${f}`)

console.log('\nMASTER 18 — related paths (filename match)')
const scanned = walk('src').concat(walk('server')).sort()
console.log(`  count: ${scanned.length}`)

console.log('\nEndpoints (code):')
console.log('  POST /api/v1/auth/register')
console.log('  POST /api/v1/auth/password-login')
console.log('  GET  /api/v1/auth/me')
console.log('  GET  /api/v1/auth/session')
console.log('  POST /api/v1/admin/bootstrap/founder')

console.log('\nOAuth: EXTERNAL CONFIGURATION REQUIRED (Supabase Auth > Providers)')
console.log('Migration pending operator: 0029_muco_login_id.sql')
