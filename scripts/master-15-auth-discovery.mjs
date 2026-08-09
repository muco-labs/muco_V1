/**
 * MASTER 15 — auth environment discovery (no secret values).
 */
import { existsSync, readFileSync } from 'node:fs'

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

const merged = { ...loadEnvFile('.env.local'), ...process.env }

const keys = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_PUBLISHABLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_AUTH_REDIRECT_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
]

console.log('MASTER 15 — auth environment\n')
for (const k of keys) {
  console.log(`${k}: ${classify(merged[k])}`)
}

console.log('\nOAuth providers (Supabase dashboard):')
console.log('google: EXTERNAL CONFIGURATION REQUIRED (verify in Supabase Auth > Providers)')
console.log('github: EXTERNAL CONFIGURATION REQUIRED (verify in Supabase Auth > Providers)')
console.log('\nApp OAuth callback path (code): /auth/callback')
console.log('Redirect base: VITE_AUTH_REDIRECT_URL or window.origin at runtime')
