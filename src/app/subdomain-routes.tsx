import type { ReactNode } from 'react'
import { Navigate, type RouteObject } from 'react-router-dom'
import type { ApplicationDomain } from '@/config/domains'
import { ProtectedPortal } from '@/components/auth/ProtectedPortal'
import { CustomerAppLayout } from '@/layouts/CustomerAppLayout'
import { EmployeeAppLayout } from '@/layouts/EmployeeAppLayout'
import { FreelancerAppLayout } from '@/layouts/FreelancerAppLayout'
import { AdminAppLayout } from '@/layouts/AdminAppLayout'
import {
  adminPortalChildren,
  buildSubdomainAuthRoutes,
  customerPortalChildren,
  employeePortalChildren,
  freelancerPortalChildren,
  subdomainPublicPaths,
} from '@/app/portal-route-trees'
import { lazy, type ComponentType } from 'react'

const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((module) => ({
    default: module.NotFoundPage as ComponentType<unknown>,
  })),
)

export { subdomainPublicPaths }

function legacyPortalPathRedirects(domain: ApplicationDomain): RouteObject[] {
  switch (domain) {
    case 'customer':
      return [{ path: '/app', element: <Navigate to="/" replace /> }]
    case 'employee':
      return [{ path: '/team', element: <Navigate to="/" replace /> }]
    case 'freelancer':
      return [{ path: '/app/freelancer', element: <Navigate to="/" replace /> }]
    case 'admin':
      return [{ path: '/admin', element: <Navigate to="/" replace /> }]
    default:
      return []
  }
}

export function buildSubdomainRoutes(domain: ApplicationDomain): RouteObject[] {
  if (domain === 'unknown' || domain === 'public') {
    return [{ path: '*', element: <NotFoundPage /> }]
  }

  const portalShell = (
    portal: 'customer' | 'employee' | 'freelancer' | 'admin',
    layout: ReactNode,
    children: RouteObject[],
  ): RouteObject => ({
    path: '/',
    element: <ProtectedPortal portal={portal}>{layout}</ProtectedPortal>,
    children: [...children, { path: '*', element: <NotFoundPage /> }],
  })

  switch (domain) {
    case 'customer':
      return [
        ...buildSubdomainAuthRoutes(domain),
        ...legacyPortalPathRedirects(domain),
        portalShell('customer', <CustomerAppLayout />, customerPortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    case 'employee':
      return [
        ...buildSubdomainAuthRoutes(domain),
        ...legacyPortalPathRedirects(domain),
        portalShell('employee', <EmployeeAppLayout />, employeePortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    case 'freelancer':
      return [
        ...buildSubdomainAuthRoutes(domain),
        ...legacyPortalPathRedirects(domain),
        portalShell('freelancer', <FreelancerAppLayout />, freelancerPortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    case 'admin':
      return [
        ...buildSubdomainAuthRoutes(domain),
        ...legacyPortalPathRedirects(domain),
        portalShell('admin', <AdminAppLayout />, adminPortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    default:
      return [{ path: '*', element: <NotFoundPage /> }]
  }
}
