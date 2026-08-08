import { lazy, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { MainLayout } from '@/layouts/MainLayout'
import { CustomerAppLayout } from '@/layouts/CustomerAppLayout'
import { EmployeeAppLayout } from '@/layouts/EmployeeAppLayout'
import { AdminAppLayout } from '@/layouts/AdminAppLayout'
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
const IndustrySolutionPage = lazyPage(
  () => import('@/pages/solutions/IndustrySolutionPage'),
  'IndustrySolutionPage',
)
const WorkPage = lazyPage(() => import('@/pages/WorkPage'), 'WorkPage')
const WorkProjectPage = lazyPage(() => import('@/pages/WorkProjectPage'), 'WorkProjectPage')
const AboutPage = lazyPage(() => import('@/pages/AboutPage'), 'AboutPage')
const InsightsPage = lazyPage(() => import('@/pages/InsightsPage'), 'InsightsPage')
const ContactPage = lazyPage(() => import('@/pages/ContactPage'), 'ContactPage')
const PricingPage = lazyPage(() => import('@/pages/PricingPage'), 'PricingPage')
const ErodePage = lazyPage(() => import('@/pages/ErodePage'), 'ErodePage')
const TamilNaduPage = lazyPage(() => import('@/pages/TamilNaduPage'), 'TamilNaduPage')
const IndiaPage = lazyPage(() => import('@/pages/IndiaPage'), 'IndiaPage')
const InternationalPage = lazyPage(
  () => import('@/pages/InternationalPage'),
  'InternationalPage',
)
const ErodeLocalServicePage = lazyPage(
  () => import('@/pages/erode/ErodeLocalServicePage'),
  'ErodeLocalServicePage',
)
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
const EmployeeDashboardPage = lazyPage(
  () => import('@/pages/portal/employee/EmployeeDashboardPage'),
  'EmployeeDashboardPage',
)

function lazyEmployeePage(exportName: string) {
  return lazy(() =>
    import('@/pages/portal/employee/EmployeePortalPages').then((module) => ({
      default: module[exportName as keyof typeof module] as ComponentType<unknown>,
    })),
  )
}

const EmployeeTasksPage = lazyEmployeePage('EmployeeTasksPage')
const EmployeeTaskDetailPage = lazyEmployeePage('EmployeeTaskDetailPage')
const EmployeeProjectsPage = lazyEmployeePage('EmployeeProjectsPage')
const EmployeeProjectDetailPage = lazyEmployeePage('EmployeeProjectDetailPage')
const EmployeeFilesPage = lazyEmployeePage('EmployeeFilesPage')
const EmployeeMessagesPage = lazyEmployeePage('EmployeeMessagesPage')
const EmployeeNotificationsPage = lazyEmployeePage('EmployeeNotificationsPage')
const EmployeeDeadlinesPage = lazyEmployeePage('EmployeeDeadlinesPage')
const EmployeeProfilePage = lazyEmployeePage('EmployeeProfilePage')
const EmployeeSettingsPage = lazyEmployeePage('EmployeeSettingsPage')

function lazyAdminPage(exportName: string) {
  return lazy(() =>
    import('@/pages/portal/admin/AdminPortalPages').then((module) => ({
      default: module[exportName as keyof typeof module] as ComponentType<unknown>,
    })),
  )
}

const AdminDashboardPage = lazyPage(
  () => import('@/pages/portal/admin/AdminDashboardPage'),
  'AdminDashboardPage',
)
const AdminCustomersPage = lazyAdminPage('AdminCustomersPage')
const AdminCustomerDetailPage = lazyAdminPage('AdminCustomerDetailPage')
const AdminEmployeesPage = lazyAdminPage('AdminEmployeesPage')
const AdminProjectsPage = lazyAdminPage('AdminProjectsPage')
const AdminTasksPage = lazyAdminPage('AdminTasksPage')
const AdminProposalsPage = lazyAdminPage('AdminProposalsPage')
const AdminInvoicesPage = lazyAdminPage('AdminInvoicesPage')
const AdminPaymentsPage = lazyAdminPage('AdminPaymentsPage')
const AdminFilesPage = lazyAdminPage('AdminFilesPage')
const AdminMessagesPage = lazyAdminPage('AdminMessagesPage')
const AdminSupportPage = lazyAdminPage('AdminSupportPage')
const AdminAnalyticsPage = lazyAdminPage('AdminAnalyticsPage')
const AdminSalesPage = lazyAdminPage('AdminSalesPage')
const AdminRevenuePage = lazyAdminPage('AdminRevenuePage')
const AdminOperationsPage = lazyAdminPage('AdminOperationsPage')
const AdminNotificationsPage = lazyAdminPage('AdminNotificationsPage')
const AdminAuditLogsPage = lazyAdminPage('AdminAuditLogsPage')
const AdminSettingsPage = lazyAdminPage('AdminSettingsPage')
const AdminSecurityPage = lazyAdminPage('AdminSecurityPage')
const AdminLocalMarketPage = lazyAdminPage('AdminLocalMarketPage')
const AdminNationalMarketPage = lazyAdminPage('AdminNationalMarketPage')
const AdminInternationalMarketPage = lazyAdminPage('AdminInternationalMarketPage')
const AdminLeadsPage = lazyAdminPage('AdminLeadsPage')

function lazyCrmPage(exportName: string) {
  return lazy(() =>
    import('@/pages/portal/admin/CrmPortalPages').then((module) => ({
      default: module[exportName as keyof typeof module] as ComponentType<unknown>,
    })),
  )
}

const CrmHomePage = lazyCrmPage('CrmHomePage')
const CrmLeadDetailPage = lazyCrmPage('CrmLeadDetailPage')
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
      { path: 'solutions/:industrySlug', element: <IndustrySolutionPage /> },
      { path: 'work', element: <WorkPage /> },
      { path: 'work/:slug', element: <WorkProjectPage /> },
      { path: 'about', element: <AboutPage /> },
      { path: 'insights', element: <InsightsPage /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'pricing', element: <PricingPage /> },
      { path: 'erode', element: <ErodePage /> },
      { path: 'erode/:serviceSlug', element: <ErodeLocalServicePage /> },
      { path: 'tamil-nadu', element: <TamilNaduPage /> },
      { path: 'india', element: <IndiaPage /> },
      { path: 'international', element: <InternationalPage /> },
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
            <EmployeeAppLayout />
          </ProtectedPortal>
        ),
        children: [
          { index: true, element: <EmployeeDashboardPage /> },
          { path: 'tasks', element: <EmployeeTasksPage /> },
          { path: 'tasks/:id', element: <EmployeeTaskDetailPage /> },
          { path: 'projects', element: <EmployeeProjectsPage /> },
          { path: 'projects/:id', element: <EmployeeProjectDetailPage /> },
          { path: 'files', element: <EmployeeFilesPage /> },
          { path: 'messages', element: <EmployeeMessagesPage /> },
          { path: 'notifications', element: <EmployeeNotificationsPage /> },
          { path: 'deadlines', element: <EmployeeDeadlinesPage /> },
          { path: 'profile', element: <EmployeeProfilePage /> },
          { path: 'settings', element: <EmployeeSettingsPage /> },
        ],
      },
      {
        path: 'admin',
        element: (
          <ProtectedPortal portal="admin">
            <AdminAppLayout />
          </ProtectedPortal>
        ),
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'crm', element: <CrmHomePage /> },
          { path: 'crm/list', element: <AdminLeadsPage /> },
          { path: 'local/erode', element: <AdminLocalMarketPage /> },
          { path: 'local/india', element: <AdminNationalMarketPage /> },
          { path: 'local/international', element: <AdminInternationalMarketPage /> },
          { path: 'operations', element: <AdminOperationsPage /> },
          { path: 'sales', element: <AdminSalesPage /> },
          { path: 'revenue', element: <AdminRevenuePage /> },
          { path: 'crm/leads/:id', element: <CrmLeadDetailPage /> },
          { path: 'leads', element: <CrmHomePage /> },
          { path: 'leads/:id', element: <CrmLeadDetailPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
          { path: 'customers/:id', element: <AdminCustomerDetailPage /> },
          { path: 'employees', element: <AdminEmployeesPage /> },
          { path: 'projects', element: <AdminProjectsPage /> },
          { path: 'tasks', element: <AdminTasksPage /> },
          { path: 'proposals', element: <AdminProposalsPage /> },
          { path: 'invoices', element: <AdminInvoicesPage /> },
          { path: 'payments', element: <AdminPaymentsPage /> },
          { path: 'files', element: <AdminFilesPage /> },
          { path: 'messages', element: <AdminMessagesPage /> },
          { path: 'support', element: <AdminSupportPage /> },
          { path: 'analytics', element: <AdminAnalyticsPage /> },
          { path: 'notifications', element: <AdminNotificationsPage /> },
          { path: 'audit-logs', element: <AdminAuditLogsPage /> },
          { path: 'settings', element: <AdminSettingsPage /> },
          { path: 'security', element: <AdminSecurityPage /> },
        ],
      },
      { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
      { path: 'terms', element: <TermsPage /> },
      { path: 'cookie-policy', element: <CookiePolicyPage /> },
      { path: '404', element: <NotFoundPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
