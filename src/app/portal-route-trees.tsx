import { lazy, type ComponentType } from 'react'
import type { RouteObject } from 'react-router-dom'

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

const SHARED_SUBDOMAIN_AUTH_PATHS = [
  '/auth/sign-in',
  '/auth/sign-up',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/unauthorized',
] as const

export const subdomainPublicPaths = (domain: import('@/config/domains').ApplicationDomain): string[] => {
  const shared = [...SHARED_SUBDOMAIN_AUTH_PATHS]
  switch (domain) {
    case 'customer':
      return [...shared, '/app']
    case 'employee':
      return [...shared, '/team', '/team/sign-in']
    case 'freelancer':
      return [...shared, '/app/freelancer']
    case 'admin':
      return [...shared, '/admin', '/admin/sign-in']
    default:
      return shared
  }
}

export function buildSubdomainAuthRoutes(domain: import('@/config/domains').ApplicationDomain): RouteObject[] {
  const shared: RouteObject[] = [
    { path: '/auth/sign-in', element: <AuthSignInPage /> },
    { path: '/auth/sign-up', element: <AuthSignUpPage /> },
    { path: '/auth/callback', element: <AuthCallbackPage /> },
    { path: '/auth/forgot-password', element: <AuthForgotPasswordPage /> },
    { path: '/auth/reset-password', element: <AuthResetPasswordPage /> },
    { path: '/auth/verify-email', element: <AuthVerifyEmailPage /> },
    { path: '/auth/unauthorized', element: <AuthUnauthorizedPage /> },
  ]
  switch (domain) {
    case 'employee':
      return [...shared, { path: '/team/sign-in', element: <TeamSignInPage /> }]
    case 'admin':
      return [...shared, { path: '/admin/sign-in', element: <AdminSignInPage /> }]
    default:
      return shared
  }
}

export const customerPortalChildren: RouteObject[] = [
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

export const employeePortalChildren: RouteObject[] = [
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

export const freelancerPortalChildren: RouteObject[] = [
  { index: true, element: <FreelancerDashboardPage /> },
  { path: 'projects', element: <FreelancerProjectsPage /> },
  { path: 'projects/:id', element: <FreelancerProjectDetailPage /> },
  { path: 'tasks', element: <FreelancerTasksPage /> },
  { path: 'services', element: <FreelancerServicesPage /> },
  { path: 'skills', element: <FreelancerSkillsPage /> },
  { path: 'profile', element: <FreelancerProfilePage /> },
  { path: 'availability', element: <FreelancerAvailabilityPage /> },
]

export const adminPortalChildren: RouteObject[] = [
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
