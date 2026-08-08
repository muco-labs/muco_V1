import { describe, expect, it } from 'vitest'
import { createLeadSchema } from './leads.js'

describe('createLeadSchema', () => {
  it('accepts a valid lead payload', () => {
    const result = createLeadSchema.safeParse({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      message: 'Need a product platform.',
      company: 'Analytical Engines',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = createLeadSchema.safeParse({
      name: 'Ada',
      message: 'Hello',
    })
    expect(result.success).toBe(false)
  })

  it('rejects overly long message', () => {
    const result = createLeadSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'x'.repeat(4001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts attribution fields', () => {
    const result = createLeadSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
      landingPath: '/services/web-development',
      utmSource: 'google',
      pageSource: 'service_detail',
    })
    expect(result.success).toBe(true)
  })
})
