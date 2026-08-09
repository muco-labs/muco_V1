#!/usr/bin/env node
/**
 * MASTER 20 — production CORS + auth endpoint probes (no secrets).
 */
const ORIGINS = [
  'https://www.mucolabs.com',
  'https://app.mucolabs.com',
  'https://team.mucolabs.com',
  'https://freelancers.mucolabs.com',
  'https://admin.mucolabs.com',
]
const API = 'https://www.mucolabs.com/api/health'

async function probeCors(origin) {
  try {
    const res = await fetch(API, {
      method: 'OPTIONS',
      headers: {
        Origin: origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type',
      },
      signal: AbortSignal.timeout(15_000),
    })
    return {
      origin,
      status: res.status,
      allowOrigin: res.headers.get('access-control-allow-origin'),
      allowCredentials: res.headers.get('access-control-allow-credentials'),
    }
  } catch (e) {
    return { origin, error: e?.message ?? 'FAILED' }
  }
}

async function probePasswordLogin() {
  try {
    const res = await fetch('https://www.mucolabs.com/api/v1/auth/password-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'CUS-TEST0001', password: 'invalid-password-probe' }),
      signal: AbortSignal.timeout(20_000),
    })
    const text = await res.text()
    let code = null
    try {
      code = JSON.parse(text)?.error?.code ?? null
    } catch {
      /* */
    }
    return { status: res.status, errorCode: code, leaksSecrets: /service.role|postgresql/i.test(text) }
  } catch (e) {
    return { error: e?.message ?? 'FAILED' }
  }
}

const cors = []
for (const o of ORIGINS) cors.push(await probeCors(o))

const passwordLogin = await probePasswordLogin()

console.log(
  JSON.stringify(
    {
      master: 'MASTER-20-cors-auth-probe',
      generatedAt: new Date().toISOString(),
      corsPreflightToHealth: cors,
      passwordLoginProbe: passwordLogin,
      note: 'Null allowOrigin usually means CORS_ORIGINS unset (same-origin only) or preflight not required for simple GET',
    },
    null,
    2,
  ),
)
