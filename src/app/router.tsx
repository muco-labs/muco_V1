import { lazy, type ComponentType, type ReactNode } from 'react'
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'
import {
  resolveApplicationDomain,
  resolveRoutingMode,
  type ApplicationDomain,
} from '@/config/domains'
import { MainLayout } from '@/layouts/MainLayout'
import { CustomerAppLayout } from '@/layouts/CustomerAppLayout'
import { EmployeeAppLayout } from '@/layouts/EmployeeAppLayout'
import { FreelancerAppLayout } from '@/layouts/FreelancerAppLayout'
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
const CustomerConversationDetailPage = lazyCustomerPage('CustomerConversationDetailPage')
const CustomerSupportPage = lazyCustomerPage('CustomerSupportPage')
const CustomerSupportDetailPage = lazyCustomerPage('CustomerSupportDetailPage')
const CustomerNotificationsPage = lazyCustomerPage('CustomerNotificationsPage')
const CustomerProfilePage = lazyCustomerPage('CustomerProfilePage')
const CustomerSettingsPage = lazyCustomerPage('CustomerSettingsPage')
const CustomerProjectRequestsPage = lazyCustomerPage('CustomerProjectRequestsPage')
const CustomerProjectRequestDetailPage = lazyCustomerPage('CustomerProjectRequestDetailPage')
const StartProjectEntryPage = lazyPage(
  () => import('@/pages/start-project/StartProjectEntryPage'),
  'StartProjectEntryPage',
)
const StartProjectFlowPage = lazyPage(
  () => import('@/pages/start-project/StartProjectFlowPage'),
  'StartProjectFlowPage',
)
const StartProjectSuccessPage = lazyPage(
  () => import('@/pages/start-project/StartProjectFlowPage'),
  'StartProjectSuccessPage',
)
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

function lazyFreelancerPage(exportName: string) {
  return lazy(() =>
    import('@/pages/portal/freelancer/FreelancerPortalPages').then((module) => ({
      default: module[exportName as keyof typeof module] as ComponentType<unknown>,
    })),
  )
}

const FreelancerDashboardPage = lazyFreelancerPage('FreelancerDashboardPage')
const FreelancerProjectsPage = lazyFreelancerPage('FreelancerProjectsPage')
const FreelancerProjectDetailPage = lazyFreelancerPage('FreelancerProjectDetailPage')
const FreelancerTasksPage = lazyFreelancerPage('FreelancerTasksPage')
const FreelancerServicesPage = lazyFreelancerPage('FreelancerServicesPage')
const FreelancerSkillsPage = lazyFreelancerPage('FreelancerSkillsPage')
const FreelancerProfilePage = lazyFreelancerPage('FreelancerProfilePage')
const FreelancerAvailabilityPage = lazyFreelancerPage('FreelancerAvailabilityPage')

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
const AdminProjectDetailPage = lazyAdminPage('AdminProjectDetailPage')
const AdminTasksPage = lazyAdminPage('AdminTasksPage')
const AdminProposalsPage = lazyAdminPage('AdminProposalsPage')
const AdminProposalDetailPage = lazyAdminPage('AdminProposalDetailPage')
const AdminProposalNewPage = lazyAdminPage('AdminProposalNewPage')
const AdminInvoicesPage = lazyAdminPage('AdminInvoicesPage')
const AdminPaymentsPage = lazyAdminPage('AdminPaymentsPage')
const AdminPaymentDetailPage = lazyAdminPage('AdminPaymentDetailPage')
const AdminFilesPage = lazyAdminPage('AdminFilesPage')
const AdminMessagesPage = lazyAdminPage('AdminMessagesPage')
const AdminConversationDetailPage = lazyAdminPage('AdminConversationDetailPage')
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
const AdminProductWaitlistPage = lazyPage(
  () => import('@/pages/portal/admin/AdminProductWaitlistPage'),
  'AdminProductWaitlistPage',
)
const AdminCareersApplicationsPage = lazyPage(
  () => import('@/pages/portal/admin/AdminCareersPages'),
  'AdminCareersApplicationsPage',
)
const AdminCareerApplicationDetailPage = lazyPage(
  () => import('@/pages/portal/admin/AdminCareersPages'),
  'AdminCareerApplicationDetailPage',
)
const AdminCareersJobsPage = lazyPage(
  () => import('@/pages/portal/admin/AdminCareersJobPages'),
  'AdminCareersJobsPage',
)
const AdminCareersJobEditPage = lazyPage(
  () => import('@/pages/portal/admin/AdminCareersJobPages'),
  'AdminCareersJobEditPage',
)
const AdminExecutivePage = lazyPage(
  () => import('@/pages/portal/admin/AdminExecutivePage'),
  'AdminExecutivePage',
)
const AdminTeamAccessPage = lazyPage(
  () => import('@/pages/portal/admin/AdminTeamAccessPage'),
  'AdminTeamAccessPage',
)
const AdminFreelancersPage = lazyPage(
  () => import('@/pages/portal/admin/AdminFreelancerPages'),
  'AdminFreelancersPage',
)
const AdminFreelancerDetailPage = lazyPage(
  () => import('@/pages/portal/admin/AdminFreelancerPages'),
  'AdminFreelancerDetailPage',
)
const AdminFreelancerDiscoverPage = lazyPage(
  () => import('@/pages/portal/admin/AdminFreelancerPages'),
  'AdminFreelancerDiscoverPage',
)
const WebsiteIntelligenceDashboardPage = lazyPage(
  () => import('@/pages/portal/admin/WebsiteIntelligencePages'),
  'WebsiteIntelligenceDashboardPage',
)
const WebsiteIntelligenceNewAuditPage = lazyPage(
  () => import('@/pages/portal/admin/WebsiteIntelligencePages'),
  'WebsiteIntelligenceNewAuditPage',
)
const WebsiteIntelligenceReportPage = lazyPage(
  () => import('@/pages/portal/admin/WebsiteIntelligencePages'),
  'WebsiteIntelligenceReportPage',
)

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

const subdomainAuthRoutes: RouteObject[] = [
  { path: '/auth/sign-in', element: <AuthSignInPage /> },
  { path: '/auth/sign-up', element: <AuthSignUpPage /> },
  { path: '/auth/callback', element: <AuthCallbackPage /> },
  { path: '/auth/forgot-password', element: <AuthForgotPasswordPage /> },
  { path: '/auth/reset-password', element: <AuthResetPasswordPage /> },
  { path: '/auth/verify-email', element: <AuthVerifyEmailPage /> },
  { path: '/auth/unauthorized', element: <AuthUnauthorizedPage /> },
  { path: '/team/sign-in', element: <TeamSignInPage /> },
  { path: '/admin/sign-in', element: <AdminSignInPage /> },
]

const customerPortalChildren: RouteObject[] = [
  { index: true, element: <CustomerDashboardPage /> },
  { path: 'start-project', element: <StartProjectFlowPage /> },
  { path: 'start-project/success/:id', element: <StartProjectSuccessPage /> },
  { path: 'project-requests', element: <CustomerProjectRequestsPage /> },
  { path: 'project-requests/:id', element: <CustomerProjectRequestDetailPage /> },
  { path: 'projects', element: <CustomerProjectsPage /> },
  { path: 'projects/:id', element: <CustomerProjectDetailPage /> },
  { path: 'proposals', element: <CustomerProposalsPage /> },
  { path: 'proposals/:id', element: <CustomerProposalDetailPage /> },
  { path: 'invoices', element: <CustomerInvoicesPage /> },
  { path: 'invoices/:id', element: <CustomerInvoiceDetailPage /> },
  { path: 'payments', element: <CustomerPaymentsPage /> },
  { path: 'files', element: <CustomerFilesPage /> },
  { path: 'messages', element: <CustomerMessagesPage /> },
  { path: 'messages/:conversationId', element: <CustomerConversationDetailPage /> },
  { path: 'support', element: <CustomerSupportPage /> },
  { path: 'support/:id', element: <CustomerSupportDetailPage /> },
  { path: 'notifications', element: <CustomerNotificationsPage /> },
  { path: 'profile', element: <CustomerProfilePage /> },
  { path: 'settings', element: <CustomerSettingsPage /> },
]

const employeePortalChildren: RouteObject[] = [
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
]

const freelancerPortalChildren: RouteObject[] = [
  { index: true, element: <FreelancerDashboardPage /> },
  { path: 'projects', element: <FreelancerProjectsPage /> },
  { path: 'projects/:id', element: <FreelancerProjectDetailPage /> },
  { path: 'tasks', element: <FreelancerTasksPage /> },
  { path: 'services', element: <FreelancerServicesPage /> },
  { path: 'skills', element: <FreelancerSkillsPage /> },
  { path: 'profile', element: <FreelancerProfilePage /> },
  { path: 'availability', element: <FreelancerAvailabilityPage /> },
]

const adminPortalChildren: RouteObject[] = [
  { index: true, element: <AdminDashboardPage /> },
  { path: 'crm', element: <CrmHomePage /> },
  { path: 'crm/list', element: <AdminLeadsPage /> },
  { path: 'local/erode', element: <AdminLocalMarketPage /> },
  { path: 'local/india', element: <AdminNationalMarketPage /> },
  { path: 'local/international', element: <AdminInternationalMarketPage /> },
  { path: 'product/waitlist', element: <AdminProductWaitlistPage /> },
  { path: 'careers', element: <AdminCareersApplicationsPage /> },
  { path: 'careers/jobs', element: <AdminCareersJobsPage /> },
  { path: 'careers/jobs/new', element: <AdminCareersJobEditPage /> },
  { path: 'careers/jobs/:id', element: <AdminCareersJobEditPage /> },
  { path: 'careers/applications/:id', element: <AdminCareerApplicationDetailPage /> },
  { path: 'freelancers', element: <AdminFreelancersPage /> },
  { path: 'freelancers/discover', element: <AdminFreelancerDiscoverPage /> },
  { path: 'freelancers/:id', element: <AdminFreelancerDetailPage /> },
  { path: 'executive', element: <AdminExecutivePage /> },
  { path: 'team/access', element: <AdminTeamAccessPage /> },
  { path: 'website-intelligence', element: <WebsiteIntelligenceDashboardPage /> },
  { path: 'website-intelligence/new', element: <WebsiteIntelligenceNewAuditPage /> },
  { path: 'website-intelligence/audits/:id', element: <WebsiteIntelligenceReportPage /> },
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
  { path: 'projects/:id', element: <AdminProjectDetailPage /> },
  { path: 'tasks', element: <AdminTasksPage /> },
  { path: 'proposals', element: <AdminProposalsPage /> },
  { path: 'proposals/new', element: <AdminProposalNewPage /> },
  { path: 'proposals/:id', element: <AdminProposalDetailPage /> },
  { path: 'invoices', element: <AdminInvoicesPage /> },
  { path: 'payments', element: <AdminPaymentsPage /> },
  { path: 'payments/:id', element: <AdminPaymentDetailPage /> },
  { path: 'files', element: <AdminFilesPage /> },
  { path: 'messages', element: <AdminMessagesPage /> },
  { path: 'messages/:conversationId', element: <AdminConversationDetailPage /> },
  { path: 'support', element: <AdminSupportPage /> },
  { path: 'analytics', element: <AdminAnalyticsPage /> },
  { path: 'notifications', element: <AdminNotificationsPage /> },
  { path: 'audit-logs', element: <AdminAuditLogsPage /> },
  { path: 'settings', element: <AdminSettingsPage /> },
  { path: 'security', element: <AdminSecurityPage /> },
]

function buildSubdomainRoutes(domain: ApplicationDomain): RouteObject[] {
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

  const legacyPortalPathRedirects = (): RouteObject[] => {
    switch (domain) {
      case 'customer':
        return [{ path: '/app', element: <Navigate to="/" replace /> }]
      case 'employee':
        return [
          { path: '/team', element: <Navigate to="/" replace /> },
        ]
      case 'freelancer':
        return [{ path: '/app/freelancer', element: <Navigate to="/" replace /> }]
      case 'admin':
        return [{ path: '/admin', element: <Navigate to="/" replace /> }]
      default:
        return []
    }
  }

  switch (domain) {
    case 'customer':
      return [
        ...subdomainAuthRoutes,
        ...legacyPortalPathRedirects(),
        portalShell('customer', <CustomerAppLayout />, customerPortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    case 'employee':
      return [
        ...subdomainAuthRoutes,
        ...legacyPortalPathRedirects(),
        portalShell('employee', <EmployeeAppLayout />, employeePortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    case 'freelancer':
      return [
        ...subdomainAuthRoutes,
        ...legacyPortalPathRedirects(),
        portalShell('freelancer', <FreelancerAppLayout />, freelancerPortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    case 'admin':
      return [
        ...subdomainAuthRoutes,
        ...legacyPortalPathRedirects(),
        portalShell('admin', <AdminAppLayout />, adminPortalChildren),
        { path: '*', element: <NotFoundPage /> },
      ]
    default:
      return [{ path: '*', element: <NotFoundPage /> }]
  }
}

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
