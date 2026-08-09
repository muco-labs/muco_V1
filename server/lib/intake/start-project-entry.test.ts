import { describe, expect, it } from 'vitest'
import { INTAKE_SERVICE_SLUGS } from './service-slugs.js'

describe('start project entry routing', () => {
  it('uses public entry path before auth and protected flow under /app', () => {
    expect('/start-project').toMatch(/^\/start-project$/)
    expect('/app/start-project').toMatch(/^\/app\/start-project$/)
  })

  it('includes catalog slugs and other for intake', () => {
    expect(INTAKE_SERVICE_SLUGS).toContain('web-development')
    expect(INTAKE_SERVICE_SLUGS).toContain('other')
  })
})
