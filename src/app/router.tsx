import { lazy, type ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router-dom'
import {
  resolveApplicationDomain,
  resolveRoutingMode,
} from '@/config/domains'
import { MainLayout } from '@/layouts/MainLayout'
import { CustomerAppLayout } from '@/layouts/CustomerAppLayout'
import { EmployeeAppLayout } from '@/layouts/EmployeeAppLayout'
import { FreelancerAppLayout } from '@/layouts/FreelancerAppLayout'
import { AdminAppLayout } from '@/layouts/AdminAppLayout'
import { ProtectedPortal } from '@/components/auth/ProtectedPortal'
import {
  adminPortalChildren,
  customerPortalChildren,
  employeePortalChildren,
  freelancerPortalChildren,
} from '@/app/portal-route-trees'
import { buildSubdomainRoutes } from '@/app/subdomain-routes'

function lazyPage<T extends Record<string, ComponentType<unknown>>>(
  loader: () => Promise<T>,
  exportName: keyof T,
) {
  return lazy(() =>
    loader().then((module) => ({
      default: module[exportName] as ComponentType<unknown>,
    })),
  )
}

const HomePage = lazyPage(() => import('@/pages/HomePage'), 'HomePage')
const ServicesPage = lazyPage(() => import('@/pages/ServicesPage'), 'ServicesPage')
const ServiceDetailPage = lazyPage(
  () => import('@/pages/ServiceDetailPage'),
  'ServiceDetailPage',
)
const SolutionsPage = lazyPage(
  () => import('@/pages/SolutionsPage'),
  'SolutionsPage',
)
const IndustrySolutionPage = lazyPage(
  () => import('@/pages/solutions/IndustrySolutionPage'),
  'IndustrySolutionPage',
)
const WorkPage = lazyPage(() => import('@/pages/WorkPage'), 'WorkPage')
const WorkProjectPage = lazyPage(() => import('@/pages/WorkProjectPage'), 'WorkProjectPage')
const AboutPage = lazyPage(() => import('@/pages/AboutPage'), 'AboutPage')
const InsightsPage = lazyPage(() => import('@/pages/InsightsPage'), 'InsightsPage')
const ContactPage = lazyPage(() => import('@/pages/ContactPage'), 'ContactPage')
const CareersPage = lazyPage(() => import('@/pages/CareersPage'), 'CareersPage')
const CareersApplyPage = lazyPage(() => import('@/pages/CareersApplyPage'), 'CareersApplyPage')
const FreelancersApplyPage = lazyPage(() => import('@/pages/FreelancersApplyPage'), 'FreelancersApplyPage')
const CareersOpeningPage = lazyPage(
  () => import('@/pages/CareersOpeningPage'),
  'CareersOpeningPage',
)
const PricingPage = lazyPage(() => import('@/pages/PricingPage'), 'PricingPage')
const ErodePage = lazyPage(() => import('@/pages/ErodePage'), 'ErodePage')
const TamilNaduPage = lazyPage(() => import('@/pages/TamilNaduPage'), 'TamilNaduPage')
const IndiaPage = lazyPage(() => import('@/pages/IndiaPage'), 'IndiaPage')
const InternationalPage = lazyPage(
  () => import('@/pages/InternationalPage'),
  'InternationalPage',
)
const ProductsPage = lazyPage(() => import('@/pages/products/ProductsPage'), 'ProductsPage')
const ClientHubProductPage = lazyPage(
  () => import('@/pages/products/ClientHubProductPage'),
  'ClientHubProductPage',
)
const ErodeLocalServicePage = lazyPage(
  () => import('@/pages/erode/ErodeLocalServicePage'),
  'ErodeLocalServicePage',
)
const AuthSignInPage = lazyPage(() => import('@/pages/AuthSignInPage'), 'AuthSignInPage')
const AuthSignUpPage = lazyPage(() => import('@/pages/AuthSignUpPage'), 'AuthSignUpPage')
const AuthCallbackPage = lazyPage(() => import('@/pages/AuthCallbackPage'), 'AuthCallbackPage')
const AuthForgotPasswordPage = lazyPage(
  () => import('@/pages/AuthForgotPasswordPage'),
  'AuthForgotPasswordPage',
)
const AuthResetPasswordPage = lazyPage(
  () => import('@/pages/AuthResetPasswordPage'),
  'AuthResetPasswordPage',
)
const AuthVerifyEmailPage = lazyPage(
  () => import('@/pages/AuthVerifyEmailPage'),
  'AuthVerifyEmailPage',
)
const AuthUnauthorizedPage = lazyPage(
  () => import('@/pages/AuthUnauthorizedPage'),
  'AuthUnauthorizedPage',
)
const TeamSignInPage = lazyPage(() => import('@/pages/TeamSignInPage'), 'TeamSignInPage')
const AdminSignInPage = lazyPage(() => import('@/pages/AdminSignInPage'), 'AdminSignInPage')
const StartProjectEntryPage = lazyPage(
  () => import('@/pages/start-project/StartProjectEntryPage'),
  'StartProjectEntryPage',
)
const PrivacyPolicyPage = lazyPage(
  () => import('@/pages/PrivacyPolicyPage'),
  'PrivacyPolicyPage',
)
const TermsPage = lazyPage(() => import('@/pages/TermsPage'), 'TermsPage')
const CookiePolicyPage = lazyPage(
  () => import('@/pages/CookiePolicyPage'),
  'CookiePolicyPage',
)
const NotFoundPage = lazyPage(() => import('@/pages/NotFoundPage'), 'NotFoundPage')

const pathPrefixRoutes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'services/:slug', element: <ServiceDetailPage /> },
      { path: 'solutions', element: <SolutionsPage /> },
      { path: 'solutions/:industrySlug', element: <IndustrySolutionPage /> },
      { path: 'work', element: <WorkPage /> },
      { path: 'work/:slug', element: <WorkProjectPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'careers', element: <CareersPage /> },
      { path: 'careers/apply', element: <CareersApplyPage /> },
      { path: 'freelancers/apply', element: <FreelancersApplyPage /> },
      { path: 'careers/openings/:slug', element: <CareersOpeningPage /> },
      { path: 'start-project', element: <StartProjectEntryPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'erode', element: <ErodePage /> },
      { path: 'erode/:serviceSlug', element: <ErodeLocalServicePage /> },
      { path: 'tamil-nadu', element: <TamilNaduPage /> },
      { path: 'india', element: <IndiaPage /> },
      { path: 'international', element: <InternationalPage /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/client-hub', element: <ClientHubProductPage /> },
      { path: 'auth/sign-in', element: <AuthSignInPage /> },
      { path: 'auth/sign-up', element: <AuthSignUpPage /> },
      { path: 'auth/callback', element: <AuthCallbackPage /> },
      { path: 'auth/forgot-password', element: <AuthForgotPasswordPage /> },
      { path: 'auth/reset-password', element: <AuthResetPasswordPage /> },
      { path: 'auth/verify-email', element: <AuthVerifyEmailPage /> },
      { path: 'auth/unauthorized', element: <AuthUnauthorizedPage /> },
      { path: 'team/sign-in', element: <TeamSignInPage /> },
      { path: 'admin/sign-in', element: <AdminSignInPage /> },
      {
        path: 'app',
        element: (
          <ProtectedPortal portal="customer">
            <CustomerAppLayout />
          </ProtectedPortal>
        ),
        children: customerPortalChildren,
      },
      {
        path: 'team',
        element: (
          <ProtectedPortal portal="employee">
            <EmployeeAppLayout />
          </ProtectedPortal>
        ),
        children: employeePortalChildren,
      },
      {
        path: 'app/freelancer',
        element: (
          <ProtectedPortal portal="freelancer">
            <FreelancerAppLayout />
          </ProtectedPortal>
        ),
        children: freelancerPortalChildren,
      },
      {
        path: 'admin',
        element: (
          <ProtectedPortal portal="admin">
            <AdminAppLayout />
          </ProtectedPortal>
        ),
        children: adminPortalChildren,
      },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'cookie-policy', element: <CookiePolicyPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export function createAppRouter() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const domain = resolveApplicationDomain(hostname)
    if (resolveRoutingMode(hostname) === 'subdomain_root' && domain !== 'public') {
      return createBrowserRouter(buildSubdomainRoutes(domain))
    }
  }
  return createBrowserRouter(pathPrefixRoutes)
}

export const router = createAppRouter()
