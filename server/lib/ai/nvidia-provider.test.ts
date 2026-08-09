import { describe, expect, it } from 'vitest'
import { getNvidiaProviderHealth, isNvidiaConfigured } from './config.js'
import { nvidiaChatCompletion } from './nvidia-provider.js'

describe('NVIDIA AI foundation', () => {
  it('is not configured without NVIDIA_API_KEY', () => {
    expect(isNvidiaConfigured()).toBe(false)
    expect(getNvidiaProviderHealth().configured).toBe(false)
  })

  it('returns not_configured without calling the network', async () => {
    const result = await nvidiaChatCompletion([{ role: 'user', content: 'ping' }])
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.code).toBe('not_configured')
  })

  it('health payload never includes key material', () => {
    const serialized = JSON.stringify(getNvidiaProviderHealth())
    expect(serialized).not.toMatch(/nvapi-[A-Za-z0-9_-]{8,}/i)
    expect(serialized).not.toContain('Bearer')
  })
})
