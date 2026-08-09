import { describe, expect, it } from 'vitest'
import { employeeNavMore, employeeNavPrimary, employeePortalPaths } from '@/config/employee-portal'

describe('employee portal navigation', () => {
  it('prioritizes work routes in primary nav', () => {
    const paths = employeeNavPrimary.map((item) => item.path)
    expect(paths).toContain(employeePortalPaths.root)
    expect(paths).toContain(employeePortalPaths.tasks)
    expect(paths).toContain(employeePortalPaths.projects)
    expect(paths).toContain(employeePortalPaths.messages)
    expect(paths).not.toContain(employeePortalPaths.settings)
  })

  it('keeps account routes in More', () => {
    const more = employeeNavMore.map((item) => item.path)
    expect(more).toContain(employeePortalPaths.profile)
    expect(more).toContain(employeePortalPaths.settings)
    expect(more).toContain(employeePortalPaths.notifications)
  })
})
