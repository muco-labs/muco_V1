import { describe, expect, it } from 'vitest'
import { normalizeLeadSource } from '../lib/crm/constants.js'
import { roleCanAccessPortal } from '../lib/auth/permissions.js'
import { hasPermission } from '../lib/auth/permissions.js'

describe('CRM access matrix', () => {
  it('TEST 2: customer cannot access admin CRM', () => {
    expect(roleCanAccessPortal(['CUSTOMER'], 'admin')).toBe(false)
  })

  it('TEST 3: developer employee without leads.view', () => {
    const perms = new Set(['tasks.view', 'projects.view'])
    expect(hasPermission(perms, 'leads.view')).toBe(false)
  })

  it('TEST 4: sales employee with leads.view', () => {
    const perms = new Set(['leads.view', 'leads.update'])
    expect(hasPermission(perms, 'leads.view')).toBe(true)
  })
})

describe('lead source normalization', () => {
  it('maps website contact to WEBSITE', () => {
    expect(normalizeLeadSource('website_contact')).toBe('WEBSITE')
  })

  it('maps manual admin entry', () => {
    expect(normalizeLeadSource('admin')).toBe('MANUAL')
  })
})
