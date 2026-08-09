import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const FORBIDDEN_IN_CLIENT = [
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'SUPABASE_SERVICE_ROLE',
  'DATABASE_URL',
] as const

describe('commercial secrets — client bundle guard', () => {
  it('does not expose payment secrets via VITE client env', () => {
    const envTs = readFileSync('src/config/env.ts', 'utf8')
    for (const key of FORBIDDEN_IN_CLIENT) {
      expect(envTs).not.toContain(key)
    }
    expect(envTs).toContain('never put server secrets in VITE_')
  })

  it('keeps Razorpay checkout helper free of secret env reads', () => {
    const checkout = readFileSync('src/lib/payments/razorpay-checkout.ts', 'utf8')
    for (const key of FORBIDDEN_IN_CLIENT) {
      expect(checkout).not.toContain(key)
    }
  })
})
