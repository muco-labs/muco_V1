#!/usr/bin/env node
/**
 * MASTER 21 — env presence (local) + production CORS probes (no secret values).
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const ORIGINS = [
  'https://www.mucolabs.com',
  'https://app.mucolabs.com',
  'https://team.mucolabs.com',
  'https://freelancers.mucolabs.com',
  'https://admin.mucolabs.com',
]

const ENV_VARS = [
  ['VITE_SITE_URL', true, 'client'],
  ['VITE_SUPABASE_URL', true, 'client'],
  ['VITE_SUPABASE_PUBLISHABLE_KEY', true, 'client'],
  ['VITE_SUPABASE_ANON_KEY', false, 'client'],
  ['VITE_AUTH_REDIRECT_URL', false, 'client'],
  ['VITE_API_BASE_URL', false, 'client'],
  ['SUPABASE_URL', true, 'server'],
  ['SUPABASE_SERVICE_ROLE_KEY', true, 'server'],
  ['SUPABASE_ANON_KEY', false, 'server'],
  ['DATABASE_URL', true, 'server'],
  ['FOUNDER_BOOTSTRAP_SECRET', false, 'server'],
  ['CORS_ORIGINS', false, 'server'],
  ['AUTH_REDIRECT_URL', false, 'server'],
  ['AUTH_INVITE_REDIRECT_URL', false, 'server'],
  ['RAZORPAY_KEY_ID', false, 'server'],
  ['RAZORPAY_KEY_SECRET', false, 'server'],
  ['SUPABASE_STORAGE_BUCKET', false, 'server'],
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

async function probe(method, url, headers = {}) {
  try {
    const res = await fetch(url, { method, headers, signal: AbortSignal.timeout(20_000) })
    return {
      method,
      url,
      status: res.status,
      allowOrigin: res.headers.get('access-control-allow-origin'),
      allowMethods: res.headers.get('access-control-allow-methods'),
    }
  } catch (e) {
    return { method, url, error: e?.message ?? 'FAILED' }
  }
}

const env = loadEnv()
const matrix = ENV_VARS.map(([name, required, scope]) => ({
  variable: name,
  required,
  scope,
  localStatus: env[name]?.trim() ? 'PRESENT' : 'MISSING',
  productionStatus: 'VERCEL DASHBOARD VERIFICATION REQUIRED',
}))

const corsProbes = {
  note: 'CORS middleware mounts only when CORS_ORIGINS is non-empty (createV1App). /api/health is outside v1 app.',
  healthOptions: await probe('OPTIONS', 'https://www.mucolabs.com/api/health', {
    Origin: ORIGINS[1],
    'Access-Control-Request-Method': 'GET',
  }),
  authMeOptions: await probe('OPTIONS', 'https://www.mucolabs.com/api/v1/auth/me', {
    Origin: ORIGINS[1],
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization,content-type',
  }),
  authMeGetWithOrigin: await probe('GET', 'https://app.mucolabs.com/api/v1/auth/me', {
    Origin: ORIGINS[1],
  }),
  leadsOptions: await probe('OPTIONS', 'https://www.mucolabs.com/api/v1/leads', {
    Origin: ORIGINS[0],
    'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'content-type',
  }),
  perOriginAuthMeOptions: [],
}

for (const origin of ORIGINS) {
  corsProbes.perOriginAuthMeOptions.push(
    await probe('OPTIONS', 'https://www.mucolabs.com/api/v1/auth/me', {
      Origin: origin,
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'authorization',
    }),
  )
}

const report = {
  master: 'MASTER-21',
  generatedAt: new Date().toISOString(),
  vercelCli: 'BLOCKED (not in PATH)',
  environmentMatrix: matrix,
  corsProbes,
  founderBootstrapSecretLocal: env.FOUNDER_BOOTSTRAP_SECRET?.trim() ? 'PRESENT' : 'MISSING',
  oauthEnvLocal: {
    GOOGLE_CLIENT_ID: env.GOOGLE_CLIENT_ID?.trim() ? 'PRESENT' : 'MISSING',
    GITHUB_CLIENT_ID: env.GITHUB_CLIENT_ID?.trim() ? 'PRESENT' : 'MISSING',
  },
}

writeFileSync('src/docs/master-21-env-cors-probe.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
