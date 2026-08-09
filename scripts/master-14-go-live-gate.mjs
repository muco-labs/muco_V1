/**
 * MASTER 14 — go-live gate recheck (no secret values).
 * Usage: node scripts/master-14-go-live-gate.mjs
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import postgres from 'postgres'

function loadEnvMerged() {
  const out = {}
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
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
  }
  return { ...out, ...process.env }
}

function present(v) {
  return v !== undefined && String(v).trim() !== '' && !/\[SENSITIVE\]/i.test(String(v))
}

const env = loadEnvMerged()
const checks = []

checks.push(['DATABASE_URL', present(env.DATABASE_URL) || present(env.POSTGRES_URL)])
checks.push(['SUPABASE_SERVICE_ROLE', present(env.SUPABASE_SERVICE_ROLE_KEY)])
checks.push(['VITE_SUPABASE_CLIENT', present(env.VITE_SUPABASE_URL) && (present(env.VITE_SUPABASE_PUBLISHABLE_KEY) || present(env.VITE_SUPABASE_ANON_KEY))])
checks.push(['RAZORPAY_KEYS', present(env.RAZORPAY_KEY_ID) && present(env.RAZORPAY_KEY_SECRET)])
checks.push(['RAZORPAY_WEBHOOK', present(env.RAZORPAY_WEBHOOK_SECRET)])
checks.push(['FOUNDER_BOOTSTRAP', present(env.FOUNDER_BOOTSTRAP_SECRET)])
checks.push(['SECURITY_GATE_BEARERS', present(env.SECURITY_GATE_BEARER_CUSTOMER_A) && present(env.SECURITY_GATE_BEARER_CUSTOMER_B)])

console.log('MASTER 14 — infrastructure recheck\n')
for (const [name, ok] of checks) {
  console.log(`${name}: ${ok ? 'PRESENT' : 'MISSING'}`)
}

const url = env.DATABASE_URL?.trim()
if (url) {
  const sql = postgres(url, { max: 1, connect_timeout: 8 })
  try {
    const [{ c }] = await sql`SELECT count(*)::int as c FROM drizzle.__drizzle_migrations`
    console.log(`drizzle_journal_rows: ${c}`)
    const migrationFiles = readdirSync('server/db/migrations').filter((f) => f.endsWith('.sql')).length
    console.log(`migration_sql_files: ${migrationFiles}`)
    console.log(`migration_safe_to_blind_migrate: ${c >= migrationFiles ? 'REVIEW' : 'NO'}`)
  } catch {
    console.log('drizzle_journal_rows: ERROR')
  } finally {
    await sql.end({ timeout: 3 })
  }
} else {
  console.log('database_probe: SKIPPED')
}

// Storage bucket probe (names only)
const supabaseUrl = env.SUPABASE_URL?.trim()
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim()
const bucket = env.SUPABASE_STORAGE_BUCKET?.trim() || 'customer-files'
if (supabaseUrl && serviceKey) {
  try {
    const res = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
    })
    if (res.ok) {
      const buckets = await res.json()
      const names = Array.isArray(buckets) ? buckets.map((b) => b.name) : []
      console.log(`storage_bucket_${bucket}: ${names.includes(bucket) ? 'EXISTS' : 'MISSING'}`)
      console.log(`storage_bucket_count: ${names.length}`)
    } else {
      console.log(`storage_list_api: HTTP_${res.status}`)
    }
  } catch {
    console.log('storage_list_api: FAILED')
  }
} else {
  console.log('storage_probe: BLOCKED (supabase server env)')
}

// Live deployment health
try {
  const hres = await fetch('https://muco-v1.vercel.app/api/health', { signal: AbortSignal.timeout(15000) })
  const body = await hres.text()
  console.log(`vercel_health_http: ${hres.status}`)
  console.log(`vercel_health_database_connected: ${/connected/.test(body) && !/unconfigured/.test(body)}`)
} catch {
  console.log('vercel_health: UNREACHABLE')
}

const sitemap = readFileSync('public/sitemap.xml', 'utf8')
const urlCount = (sitemap.match(/<url>/g) || []).length
console.log(`sitemap_url_count: ${urlCount}`)
console.log(`sitemap_uses_www: ${sitemap.includes('https://www.mucolabs.com')}`)
console.log(`sitemap_muco_root: ${sitemap.includes('https://mucolabs.com') && !sitemap.includes('https://www.mucolabs.com')}`)
