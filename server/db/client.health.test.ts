import { describe, expect, it } from 'vitest'
import { checkDatabaseConnection } from './client.js'

describe('checkDatabaseConnection', () => {
  it('returns unconfigured when DATABASE_URL is absent', async () => {
    await expect(checkDatabaseConnection()).resolves.toBe('unconfigured')
  })

  it('completes within serverless health budget', async () => {
    const start = Date.now()
    await checkDatabaseConnection()
    expect(Date.now() - start).toBeLessThan(5_000)
  })
})
