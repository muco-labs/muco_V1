#!/usr/bin/env node
/**
 * MASTER 23 — operator pipeline probes (no secret values in output).
 * Usage: node scripts/master-23-operator-pipeline-probe.mjs
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import postgres from 'postgres'

const ORIGINS = [
  'https://www.mucolabs.com',
  'https://app.mucolabs.com',
  'https://team.mucolabs.com',
  'https://freelancers.mucolabs.com',
  'https://admin.mucolabs.com',
]

function loadEnv() {
  const env = { ...process.env }
  for (const file of ['.env', '.env.local']) {
    if (!existsSync(file)) continue
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      if (!line || line.startsWith('#')) continue
      const i = line.indexOf('=')
      if (i < 0) continue
      env[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return env
}

async function probe(method, url, headers = {}, body) {
  try {
    const res = await fetch(url, {
      method,
      headers,
      body,
      signal: AbortSignal.timeout(20_000),
    })
    return { method, url, status: res.status }
  } catch (e) {
    return { method, url, error: e?.message ?? 'FAILED' }
  }
}

const env = loadEnv()
const supabaseUrl = (env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').replace(/\/$/, '')
const anonKey =
  env.SUPABASE_ANON_KEY ||
  env.SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  env.VITE_SUPABASE_ANON_KEY ||
  ''

let supabaseAuth = { status: 'BLOCKED', reason: 'missing SUPABASE_URL or publishable/anon key locally' }
if (supabaseUrl && anonKey) {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      signal: AbortSignal.timeout(15_000),
    })
    if (res.ok) {
      const j = await res.json()
      supabaseAuth = {
        status: 'PASS',
        httpStatus: res.status,
        external: {
          email: Boolean(j.external?.email),
          google: Boolean(j.external?.google),
          github: Boolean(j.external?.github),
        },
      }
    } else {
      supabaseAuth = { status: 'BLOCKED', httpStatus: res.status, reason: 'auth settings request failed' }
    }
  } catch (e) {
    supabaseAuth = { status: 'BLOCKED', reason: e?.message ?? 'auth settings failed' }
  }
}

let db = { connection: 'NOT_CONNECTED' }
const dbUrl = env.DATABASE_URL?.trim()
if (dbUrl) {
  const sql = postgres(dbUrl, { max: 1, connect_timeout: 15 })
  try {
    const [{ count: usersRowCount }] = await sql`select count(*)::int as count from users`
    const [{ count: mucoPopulated }] =
      await sql`select count(*)::int as count from users where muco_login_id is not null`
    const roles = await sql`
      select r.name as role, count(distinct u.id)::int as users
      from users u
      join user_roles ur on ur.user_id = u.id
      join roles r on r.id = ur.role_id
      group by r.name
      order by r.name
    `
    const buckets = await sql`select id, name, public from storage.buckets order by name`
    const [{ count: drizzleCount }] =
      await sql`select count(*)::int as count from drizzle.__drizzle_migrations`
    db = {
      connection: 'CONNECTED',
      usersRowCount,
      mucoLoginIdPopulatedCount: mucoPopulated,
      roleCounts: roles,
      storageBuckets: buckets.map((b) => ({ name: b.name, public: b.public })),
      drizzleMigrationRowCount: drizzleCount,
    }
  } catch (e) {
    db = {
      connection: 'ERROR',
      error: e?.message?.replace(/postgres:\/\/[^@]+@/gi, 'postgres://***@') ?? 'query failed',
    }
  } finally {
    await sql.end({ timeout: 3 }).catch(() => undefined)
  }
}

const portalAuthRoutes = []
for (const base of ORIGINS.filter((o) => o.includes('app.') || o.includes('admin.'))) {
  for (const path of ['/auth/sign-in', '/auth/callback']) {
    portalAuthRoutes.push(await probe('GET', `${base}${path}`))
  }
}

const productionSignals = {
  founderBootstrapEndpoint: await probe(
    'POST',
    'https://www.mucolabs.com/api/v1/admin/bootstrap/founder',
    { 'content-type': 'application/json' },
    '{}',
  ),
  passwordLoginValidation: await probe(
    'POST',
    'https://www.mucolabs.com/api/v1/auth/password-login',
    { 'content-type': 'application/json' },
    JSON.stringify({ loginId: 'probe-invalid', password: 'x' }),
  ),
  health: await probe('GET', 'https://www.mucolabs.com/api/health'),
  razorpayWebhookRoute: await probe('POST', 'https://www.mucolabs.com/api/v1/webhooks/razorpay', {
    'content-type': 'application/json',
  }),
}

const report = {
  master: 'MASTER-23',
  generatedAt: new Date().toISOString(),
  pipeline: {
    master22Docs: 'PASS (committed on main)',
    operatorConfiguration: 'OPERATOR — execute MASTER-22 checklist',
    vercel: 'VERCEL DASHBOARD VERIFICATION REQUIRED (CLI BLOCKED)',
    supabaseAuthSettings: supabaseAuth,
    founderAccount: {
      bootstrapPostEmptyBodyStatus: productionSignals.founderBootstrapEndpoint.status,
      interpretation:
        productionSignals.founderBootstrapEndpoint.status === 404
          ? 'FOUNDER_BOOTSTRAP_SECRET likely unset on Production (endpoint hidden)'
          : 'Review status — secret may be set or validation failed',
      founderRowsInDb:
        db.roleCounts?.find((r) => r.role === 'FOUNDER')?.users ?? 0,
    },
    testCustomers: {
      customerRows: db.usersRowCount ?? 'UNKNOWN',
      customerRoleCount: db.roleCounts?.find((r) => r.role === 'CUSTOMER')?.users ?? 'UNKNOWN',
      secondCustomerForIdor: (db.usersRowCount ?? 0) >= 2 ? 'LIKELY' : 'BLOCKED (need CUSTOMER_B)',
      mucoLoginIdPopulated: db.mucoLoginIdPopulatedCount ?? 'UNKNOWN',
    },
    employee: {
      employeeRoleCount: db.roleCounts?.find((r) => r.role === 'EMPLOYEE')?.users ?? 0,
    },
    freelancer: {
      freelancerRoleCount: db.roleCounts?.find((r) => r.role === 'FREELANCER')?.users ?? 0,
    },
    googleOAuth: {
      supabaseProviderEnabled: supabaseAuth.external?.google ?? 'UNKNOWN',
      browserQa: 'BLOCKED (operator credentials)',
    },
    githubOAuth: {
      supabaseProviderEnabled: supabaseAuth.external?.github ?? 'UNKNOWN',
      browserQa: 'BLOCKED (operator credentials)',
    },
    email: {
      supabaseEmailProvider: supabaseAuth.external?.email ?? 'UNKNOWN',
      resendLocal: env.RESEND_API_KEY?.trim() ? 'PRESENT' : 'MISSING',
    },
    razorpay: {
      keysLocal: env.RAZORPAY_KEY_ID?.trim() ? 'PRESENT' : 'MISSING',
      webhookProbeStatus: productionSignals.razorpayWebhookRoute.status,
    },
    storage: {
      buckets: db.storageBuckets ?? [],
      bucketConfigured: (db.storageBuckets?.length ?? 0) > 0 ? 'PASS' : 'BLOCKED (no buckets)',
    },
    liveBrowserQa: 'BLOCKED (no operator test passwords)',
    idorRoleIsolation: {
      securityGateRun: env.SECURITY_GATE_RUN === '1' ? 'ENABLED' : 'MISSING',
      bearerCustomerA: env.SECURITY_GATE_BEARER_CUSTOMER_A?.trim() ? 'PRESENT' : 'MISSING',
    },
    finalSecurity: 'Run npm test + SECURITY_GATE_RUN=1 when bearers exist',
  },
  dnsHttps: {
    note: 'Re-run master-19 for full portal matrix',
  },
  portalAuthRoutes,
  productionSignals,
  localEnvPresence: {
    FOUNDER_BOOTSTRAP_SECRET: env.FOUNDER_BOOTSTRAP_SECRET?.trim() ? 'PRESENT' : 'MISSING',
    SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY?.trim() ? 'PRESENT' : 'MISSING',
    CORS_ORIGINS: env.CORS_ORIGINS?.trim() ? 'PRESENT' : 'MISSING',
  },
}

writeFileSync('src/docs/master-23-operator-pipeline-probe.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
