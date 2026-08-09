import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consumeOAuthReturnPath, persistOAuthReturnPath } from './oauth-return-path'

describe('oauth-return-path', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('sessionStorage', {
      setItem: (k: string, v: string) => store.set(k, v),
      getItem: (k: string) => store.get(k) ?? null,
      removeItem: (k: string) => store.delete(k),
    })
  })

  it('persists and consumes return path once', () => {
    persistOAuthReturnPath('/app/projects/1')
    expect(consumeOAuthReturnPath()).toBe('/app/projects/1')
    expect(consumeOAuthReturnPath()).toBeUndefined()
  })
})
