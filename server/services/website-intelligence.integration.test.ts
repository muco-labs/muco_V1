import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { runWebsiteAuditJob } from './website-intelligence.runner.js'

describe('website audit integration (mocked fetch)', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string | URL | Request) => {
        const url = String(input)
        if (url.includes('robots.txt')) {
          return new Response('User-agent: *\nDisallow:\nSitemap: https://shop.test/sitemap.xml', {
            status: 200,
          })
        }
        if (url.includes('sitemap')) {
          return new Response('<urlset></urlset>', { status: 200, headers: { 'content-type': 'application/xml' } })
        }
        return new Response(
          `<!DOCTYPE html><html lang="en"><head><title>Shop</title><meta name="viewport" content="width=device-width"><meta name="description" content="Test shop"></head><body><h1>Welcome</h1><a href="/about">About</a><img src="/a.png" alt=""><img src="/b.png"></body></html>`,
          { status: 200, headers: { 'content-type': 'text/html' } },
        )
      }),
    )
  })

  afterEach(() => {
    vi.stubGlobal('fetch', originalFetch)
  })

  it('skips when database is not configured', async () => {
    await expect(runWebsiteAuditJob('00000000-0000-0000-0000-000000000001')).resolves.toBeUndefined()
  })
})
