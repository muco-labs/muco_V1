import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const app = createApp()

beforeAll(async () => {
  await app.fetch(new Request('http://localhost/api/health'))
}, 20_000)

async function api(
  path: string,
  init?: RequestInit,
): Promise<{ status: number; json: unknown; text: string }> {
  const res = await app.fetch(new Request(`http://localhost${path}`, init))
  const text = await res.text()
  let json: unknown = null
  try {
    json = JSON.parse(text)
  } catch {
    json = null
  }
  return { status: res.status, json, text }
}

describe('MASTER 04.1 — unauthenticated API boundary (live app.fetch)', () => {
  const protectedGets = [
    '/api/v1/customer/dashboard',
    '/api/v1/employee/dashboard',
    '/api/v1/freelancer/profile',
    '/api/v1/admin/dashboard',
    '/api/v1/auth/session',
  ] as const

  it.each(protectedGets)('GET %s is denied without Bearer token', async (path) => {
    const { status, json } = await api(path)
    expect([401, 403, 404, 503]).toContain(status)
    expect(json).toMatchObject({
      success: false,
      error: { code: expect.stringMatching(/UNAUTHORIZED|FORBIDDEN|NOT_FOUND|SERVICE_UNAVAILABLE/) },
    })
  }, 15_000)

  it('GET /api/v1/auth/me is denied without Bearer token', async () => {
    const { status, json } = await api('/api/v1/auth/me')
    expect([401, 403, 404, 503]).toContain(status)
    expect(json).toMatchObject({ success: false })
  }, 15_000)

  it('invalid Bearer token is denied', async () => {
    const { status, json } = await api('/api/v1/customer/dashboard', {
      headers: { Authorization: 'Bearer invalid-token-for-gate-test' },
    })
    expect([401, 403, 404, 503]).toContain(status)
    expect(json).toMatchObject({
      success: false,
      error: { code: expect.stringMatching(/UNAUTHORIZED|FORBIDDEN|NOT_FOUND|SERVICE_UNAVAILABLE/) },
    })
  }, 15_000)

  it('error responses do not leak stack traces or secrets', async () => {
    const { text } = await api('/api/v1/customer/projects', {
      headers: { Authorization: 'Bearer invalid' },
    })
    expect(text.toLowerCase()).not.toMatch(/stack trace|at \w+\./)
    expect(text).not.toMatch(/SERVICE_ROLE|DATABASE_URL|RAZORPAY_KEY_SECRET/i)
  })
})

describe('MASTER 04.1 — authenticated matrix (requires live tokens)', () => {
  const customerToken = process.env.SECURITY_GATE_BEARER_CUSTOMER_A?.trim()
  const customerBProjectId = process.env.SECURITY_GATE_CUSTOMER_B_PROJECT_ID?.trim()
  const runLive = process.env.SECURITY_GATE_RUN === '1' && Boolean(customerToken)

  it.skipIf(!runLive)(
    'CUSTOMER_A cannot read CUSTOMER_B project by ID (IDOR)',
    async () => {
      if (!customerBProjectId) {
        console.warn('SECURITY_GATE_CUSTOMER_B_PROJECT_ID unset — IDOR subtest skipped')
        return
      }
      const { status, json, text } = await api(`/api/v1/customer/projects/${customerBProjectId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      })
      expect([403, 404]).toContain(status)
      expect(text).not.toMatch(/SERVICE_ROLE|postgres/i)
      if (json && typeof json === 'object' && 'success' in json) {
        expect((json as { success: boolean }).success).toBe(false)
      }
    },
  )

  it.skipIf(!runLive)('CUSTOMER_A /auth/me returns registered profile', async () => {
    const { status, json } = await api('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${customerToken}` },
    })
    expect(status).toBe(200)
    expect(json).toMatchObject({
      success: true,
      data: { registered: true },
    })
  })
})
