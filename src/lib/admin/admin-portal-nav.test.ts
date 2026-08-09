import { describe, expect, it } from 'vitest'
import {
  adminNavSectionDefs,
  adminNavSectionsForPermissions,
  adminPortalPaths,
} from '@/config/admin-portal'

describe('admin portal navigation', () => {
  it('defines operational section groups', () => {
    const titles = adminNavSectionDefs.map((s) => s.title)
    expect(titles).toContain('CRM & growth')
    expect(titles).toContain('Delivery')
    expect(titles).toContain('System')
  })

  it('filters sections by permissions', () => {
    const sections = adminNavSectionsForPermissions(['leads.view', 'customers.view'])
    const paths = sections.flatMap((s) => s.items.map((i) => i.path))
    expect(paths).toContain(adminPortalPaths.crm)
    expect(paths).toContain(adminPortalPaths.customers)
    expect(paths).not.toContain(adminPortalPaths.payments)
  })
})
