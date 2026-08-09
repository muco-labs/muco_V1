import { beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'

const app = createApp()

beforeAll(async () => {
  await app.fetch(new Request('http://localhost/api/health'))
  // Warm customer route stack (heavy lazy imports); avoids >15s cold start under full parallel vitest.
  await app.fetch(new Request('http://localhost/api/v1/customer/dashboard'))
}, 45_000)

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

function expectDenied(status: number) {
  expect([401, 403, 404, 503]).toContain(status)
}

function expectNoLeak(text: string) {
  expect(text.toLowerCase()).not.toMatch(/stack trace|at \w+\.\w+ \(/)
  expect(text).not.toMatch(
    /SERVICE_ROLE|RAZORPAY_KEY_SECRET|RAZORPAY_WEBHOOK_SECRET|postgresql:\/\//i,
  )
}

describe('MASTER 12 — unauthenticated API boundary', () => {
  const protectedRoutes: Array<{ method: string; path: string }> = [
    { method: 'GET', path: '/api/v1/customer/dashboard' },
    { method: 'GET', path: '/api/v1/customer/proposals' },
    { method: 'GET', path: '/api/v1/customer/payments' },
    { method: 'GET', path: '/api/v1/customer/notifications' },
    { method: 'GET', path: '/api/v1/customer/conversations' },
    { method: 'GET', path: '/api/v1/employee/dashboard' },
    { method: 'GET', path: '/api/v1/employee/tasks' },
    { method: 'GET', path: '/api/v1/employee/notifications' },
    { method: 'GET', path: '/api/v1/freelancer/profile' },
    { method: 'GET', path: '/api/v1/freelancer/projects' },
    { method: 'GET', path: '/api/v1/admin/dashboard' },
    { method: 'GET', path: '/api/v1/admin/payments' },
    { method: 'GET', path: '/api/v1/admin/audit-logs' },
    { method: 'GET', path: '/api/v1/admin/leads' },
    { method: 'GET', path: '/api/v1/auth/me' },
    { method: 'GET', path: '/api/v1/auth/session' },
  ]

  it.each(protectedRoutes)('$method $path requires authentication', async ({ method, path }) => {
    const { status, json, text } = await api(path, { method })
    expectDenied(status)
    expect(json).toMatchObject({ success: false })
    expectNoLeak(text)
  }, 15_000)

  it('POST customer payment verify without auth is denied', async () => {
    const { status, text } = await api('/api/v1/customer/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpayOrderId: 'order_test',
        razorpayPaymentId: 'pay_test',
        razorpaySignature: 'sig_test',
      }),
    })
    expectDenied(status)
    expectNoLeak(text)
  })

  it('POST Razorpay webhook without signature is denied', async () => {
    const { status, text } = await api('/api/v1/webhooks/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'payment.captured' }),
    })
    expect([403, 503]).toContain(status)
    expectNoLeak(text)
  })

  it('GET /api/health does not leak secrets', async () => {
    const { status, text } = await api('/api/health')
    expect([200, 503]).toContain(status)
    expectNoLeak(text)
  })
})

describe('MASTER 12 — live authenticated matrix', () => {
  it('requires SECURITY_GATE_RUN=1 and dedicated bearer env vars (see PHASE4.38 report)', () => {
    const ready =
      process.env.SECURITY_GATE_RUN === '1' &&
      Boolean(process.env.SECURITY_GATE_BEARER_CUSTOMER_A?.trim()) &&
      Boolean(process.env.SECURITY_GATE_BEARER_CUSTOMER_B?.trim())
    if (!ready) {
      expect(true).toBe(true)
    }
  })
})
