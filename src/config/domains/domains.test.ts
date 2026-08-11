import { describe, expect, it } from 'vitest'
import {
  profileMayUseApplicationDomain,
  resolveApplicationDomain,
  resolveLegacyPortalRedirectUrl,
  resolveRoutingMode,
  resolvePortalSignInPath,
  resolveFreelancerApplyUrl,
  isMucolabsPortalHostname,
  isMucolabsPortalOrigin,
} from '@/config/domains'

describe('resolveApplicationDomain', () => {
  it('maps production hosts', () => {
    expect(resolveApplicationDomain('www.mucolabs.com')).toBe('public')
    expect(resolveApplicationDomain('app.mucolabs.com')).toBe('customer')
    expect(resolveApplicationDomain('team.mucolabs.com')).toBe('employee')
    expect(resolveApplicationDomain('freelancers.mucolabs.com')).toBe('freelancer')
    expect(resolveApplicationDomain('admin.mucolabs.com')).toBe('admin')
  })

  it('maps staging to public path-prefix mode', () => {
    expect(resolveApplicationDomain('muco-v1.vercel.app')).toBe('public')
    expect(resolveRoutingMode('muco-v1.vercel.app')).toBe('path_prefix')
    expect(resolveApplicationDomain('deploy-preview--muco.netlify.app')).toBe('public')
    expect(resolveRoutingMode('deploy-preview--muco.netlify.app')).toBe('path_prefix')
  })

  it('uses subdomain_root on portal hosts', () => {
    expect(resolveRoutingMode('app.mucolabs.com')).toBe('subdomain_root')
    expect(resolveRoutingMode('admin.mucolabs.com')).toBe('subdomain_root')
  })

  it('unknown host is safe', () => {
    expect(resolveApplicationDomain('evil.example')).toBe('unknown')
    expect(resolveApplicationDomain('app.evil.example')).toBe('unknown')
  })
})

describe('domain + role security', () => {
  const customerProfile = {
    registered: true,
    email: 'c@x.com',
    emailVerified: true,
    status: 'active',
    roles: ['CUSTOMER'],
    permissions: [],
    portals: { customer: true, employee: false, admin: false, freelancer: false },
  }

  it('admin domain + customer profile → denied', () => {
    expect(profileMayUseApplicationDomain(customerProfile, 'admin')).toBe(false)
  })

  it('team domain + customer profile → denied', () => {
    expect(profileMayUseApplicationDomain(customerProfile, 'employee')).toBe(false)
  })
})

describe('legacy portal redirects', () => {
  it('redirects /app on www to app origin', () => {
    expect(resolveLegacyPortalRedirectUrl('www.mucolabs.com', '/app/projects')).toBe(
      'https://app.mucolabs.com/projects',
    )
  })

  it('does not redirect on preview staging hosts', () => {
    expect(resolveLegacyPortalRedirectUrl('muco-v1.vercel.app', '/app/projects')).toBeNull()
    expect(resolveLegacyPortalRedirectUrl('deploy-preview--muco.netlify.app', '/app/projects')).toBeNull()
  })
})

describe('portal hostname helpers', () => {
  it('detects mucolabs portal subdomains', () => {
    expect(isMucolabsPortalHostname('admin.mucolabs.com')).toBe(true)
    expect(isMucolabsPortalHostname('www.mucolabs.com')).toBe(false)
    expect(isMucolabsPortalOrigin('https://app.mucolabs.com')).toBe(true)
  })

  it('resolvePortalSignInPath uses subdomain paths on portal hosts', () => {
    expect(resolvePortalSignInPath('admin', 'admin.mucolabs.com')).toBe('/admin/sign-in')
    expect(resolvePortalSignInPath('admin', 'www.mucolabs.com')).toBe('/admin/sign-in')
    expect(resolvePortalSignInPath('employee', 'team.mucolabs.com')).toBe('/team/sign-in')
    expect(resolvePortalSignInPath('customer', 'app.mucolabs.com')).toBe('/auth/sign-in')
  })
})

describe('resolveFreelancerApplyUrl', () => {
  it('uses www origin on portal subdomains', () => {
    expect(resolveFreelancerApplyUrl('freelancers.mucolabs.com')).toBe(
      'https://www.mucolabs.com/freelancers/apply',
    )
  })

  it('uses relative path on path-prefix hosts', () => {
    expect(resolveFreelancerApplyUrl('localhost')).toBe('/freelancers/apply')
  })
})
