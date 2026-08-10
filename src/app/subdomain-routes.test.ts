import { describe, expect, it } from 'vitest'
import { matchRoutes } from 'react-router-dom'
import { ProtectedPortal } from '@/components/auth/ProtectedPortal'
import { buildSubdomainRoutes, subdomainPublicPaths } from '@/app/subdomain-routes'

function routeChainUsesProtectedPortal(pathname: string, routes: ReturnType<typeof buildSubdomainRoutes>) {
  const matches = matchRoutes(routes, pathname) ?? []
  return matches.some((match) => {
    const element = match.route.element
    if (!element || typeof element !== 'object') return false
    return (element as { type?: unknown }).type === ProtectedPortal
  })
}

describe('buildSubdomainRoutes', () => {
  it('lists public auth paths for admin portal', () => {
    expect(subdomainPublicPaths('admin')).toContain('/auth/callback')
    expect(subdomainPublicPaths('admin')).toContain('/admin/sign-in')
  })

  it('does not wrap /admin/sign-in in ProtectedPortal on admin host', () => {
    const routes = buildSubdomainRoutes('admin')
    expect(routeChainUsesProtectedPortal('/admin/sign-in', routes)).toBe(false)
    expect(routeChainUsesProtectedPortal('/auth/callback', routes)).toBe(false)
  })

  it('wraps portal root in ProtectedPortal on admin host', () => {
    const routes = buildSubdomainRoutes('admin')
    expect(routeChainUsesProtectedPortal('/', routes)).toBe(true)
  })

  it('does not wrap team sign-in on employee host', () => {
    const routes = buildSubdomainRoutes('employee')
    expect(routeChainUsesProtectedPortal('/team/sign-in', routes)).toBe(false)
    expect(routeChainUsesProtectedPortal('/', routes)).toBe(true)
  })
})
