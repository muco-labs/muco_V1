import { describe, expect, it } from 'vitest'
import { resolveSafeCustomerReturnPath } from './safe-return-path'

describe('resolveSafeCustomerReturnPath', () => {
  it('allows start project flow with query', () => {
    expect(resolveSafeCustomerReturnPath('/app/start-project?service=seo')).toBe(
      '/app/start-project?service=seo',
    )
  })

  it('rejects external and protocol-relative targets', () => {
    expect(resolveSafeCustomerReturnPath('https://evil.test/app')).toBe('/app')
    expect(resolveSafeCustomerReturnPath('//evil.test/app')).toBe('/app')
  })

  it('rejects non-customer portal paths', () => {
    expect(resolveSafeCustomerReturnPath('/admin')).toBe('/app')
    expect(resolveSafeCustomerReturnPath('/team/tasks')).toBe('/app')
  })

  it('rejects path traversal', () => {
    expect(resolveSafeCustomerReturnPath('/app/../admin')).toBe('/app')
    expect(resolveSafeCustomerReturnPath('/app/%2e%2e/admin')).toBe('/app')
  })

  it('rejects control characters', () => {
    expect(resolveSafeCustomerReturnPath('/app/\x08dashboard')).toBe('/app')
  })
})
