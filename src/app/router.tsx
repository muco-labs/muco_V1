import { lazy, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { CustomerAppLayout } from '@/layouts/CustomerAppLayout'
import { ProtectedPortal } from '@/components/auth/ProtectedPortal'

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
const WorkPage = lazyPage(() => import('@/pages/WorkPage'), 'WorkPage')
const AboutPage = lazyPage(() => import('@/pages/AboutPage'), 'AboutPage')
const InsightsPage = lazyPage(() => import('@/pages/InsightsPage'), 'InsightsPage')
const ContactPage = lazyPage(() => import('@/pages/ContactPage'), 'ContactPage')
const PricingPage = lazyPage(() => import('@/pages/PricingPage'), 'PricingPage')
const AuthSignInPage = lazyPage(() => import('@/pages/AuthSignInPage'), 'AuthSignInPage')
const AuthSignUpPage = lazyPage(() => import('@/pages/AuthSignUpPage'), 'AuthSignUpPage')
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
const CustomerDashboardPage = lazyPage(
  () => import('@/pages/portal/customer/CustomerDashboardPage'),
  'CustomerDashboardPage',
)
function lazyCustomerPage(exportName: string) {
  return lazy(() =>
    import('@/pages/portal/customer/CustomerPortalPages').then((module) => ({
      default: module[exportName as keyof typeof module] as ComponentType<unknown>,
    })),
  )
}

const CustomerProjectsPage = lazyCustomerPage('CustomerProjectsPage')
const CustomerProjectDetailPage = lazyCustomerPage('CustomerProjectDetailPage')
const CustomerProposalsPage = lazyCustomerPage('CustomerProposalsPage')
const CustomerProposalDetailPage = lazyCustomerPage('CustomerProposalDetailPage')
const CustomerInvoicesPage = lazyCustomerPage('CustomerInvoicesPage')
const CustomerInvoiceDetailPage = lazyCustomerPage('CustomerInvoiceDetailPage')
const CustomerPaymentsPage = lazyCustomerPage('CustomerPaymentsPage')
const CustomerFilesPage = lazyCustomerPage('CustomerFilesPage')
const CustomerMessagesPage = lazyCustomerPage('CustomerMessagesPage')
const CustomerSupportPage = lazyCustomerPage('CustomerSupportPage')
const CustomerSupportDetailPage = lazyCustomerPage('CustomerSupportDetailPage')
const CustomerNotificationsPage = lazyCustomerPage('CustomerNotificationsPage')
const CustomerProfilePage = lazyCustomerPage('CustomerProfilePage')
const CustomerSettingsPage = lazyCustomerPage('CustomerSettingsPage')
const TeamAppHomePage = lazyPage(
  () => import('@/pages/portal/TeamAppHomePage'),
  'TeamAppHomePage',
)
const AdminAppHomePage = lazyPage(
  () => import('@/pages/portal/AdminAppHomePage'),
  'AdminAppHomePage',
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

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'services/:slug', element: <ServiceDetailPage /> },
      { path: 'solutions', element: <SolutionsPage /> },
      { path: 'work', element: <WorkPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'auth/sign-in', element: <AuthSignInPage /> },
      { path: 'auth/sign-up', element: <AuthSignUpPage /> },
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
        children: [
          { index: true, element: <CustomerDashboardPage /> },
          { path: 'projects', element: <CustomerProjectsPage /> },
          { path: 'projects/:id', element: <CustomerProjectDetailPage /> },
          { path: 'proposals', element: <CustomerProposalsPage /> },
          { path: 'proposals/:id', element: <CustomerProposalDetailPage /> },
          { path: 'invoices', element: <CustomerInvoicesPage /> },
          { path: 'invoices/:id', element: <CustomerInvoiceDetailPage /> },
          { path: 'payments', element: <CustomerPaymentsPage /> },
          { path: 'files', element: <CustomerFilesPage /> },
          { path: 'messages', element: <CustomerMessagesPage /> },
          { path: 'support', element: <CustomerSupportPage /> },
          { path: 'support/:id', element: <CustomerSupportDetailPage /> },
          { path: 'notifications', element: <CustomerNotificationsPage /> },
          { path: 'profile', element: <CustomerProfilePage /> },
          { path: 'settings', element: <CustomerSettingsPage /> },
        ],
      },
      {
        path: 'team',
        element: (
          <ProtectedPortal portal="employee">
            <TeamAppHomePage />
          </ProtectedPortal>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedPortal portal="admin">
            <AdminAppHomePage />
          </ProtectedPortal>
        ),
      },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'cookie-policy', element: <CookiePolicyPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
