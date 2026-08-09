import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('MASTER 14 go-live static gates', () => {
  it('sitemap has 44 public URLs (current inventory)', () => {
    const xml = readFileSync('public/sitemap.xml', 'utf8')
    const count = (xml.match(/<url>/g) || []).length
    expect(count).toBe(44)
  })

  it('robots.txt references production sitemap host (www canonical)', () => {
    const robots = readFileSync('public/robots.txt', 'utf8')
    expect(robots).toMatch(/Sitemap:\s*https:\/\/www\.mucolabs\.com\/sitemap\.xml/)
  })

  it('sitemap uses www canonical URLs', () => {
    const xml = readFileSync('public/sitemap.xml', 'utf8')
    expect(xml).toContain('https://www.mucolabs.com')
    expect(xml).not.toMatch(/<loc>https:\/\/mucolabs\.com[^<]/)
  })
})
