export const adminPortalPaths = {
  root: '/admin',
  crm: '/admin/crm',
  crmLeadsList: '/admin/crm/list',
  localErode: '/admin/local/erode',
  localIndia: '/admin/local/india',
  localInternational: '/admin/local/international',
  productWaitlist: '/admin/product/waitlist',
  executive: '/admin/executive',
  teamAccess: '/admin/team/access',
  operations: '/admin/operations',
  sales: '/admin/sales',
  revenue: '/admin/revenue',
  crmLeadDetail: (id: string) => `/admin/crm/leads/${id}`,
  leads: '/admin/crm',
  leadDetail: (id: string) => `/admin/crm/leads/${id}`,
  customers: '/admin/customers',
  customerDetail: (id: string) => `/admin/customers/${id}`,
  employees: '/admin/employees',
  projects: '/admin/projects',
  tasks: '/admin/tasks',
  proposals: '/admin/proposals',
  invoices: '/admin/invoices',
  payments: '/admin/payments',
  files: '/admin/files',
  messages: '/admin/messages',
  support: '/admin/support',
  analytics: '/admin/analytics',
  notifications: '/admin/notifications',
  auditLogs: '/admin/audit-logs',
  settings: '/admin/settings',
  security: '/admin/security',
} as const

export type AdminNavItem = {
  label: string
  path: string
  end?: boolean
  permission?: string | null
}

export const adminNav: AdminNavItem[] = [
  { label: 'Dashboard', path: adminPortalPaths.root, end: true, permission: null },
  { label: 'CRM', path: adminPortalPaths.crm, permission: 'leads.view' },
  { label: 'Erode market', path: adminPortalPaths.localErode, permission: 'leads.view' },
  { label: 'India market', path: adminPortalPaths.localIndia, permission: 'leads.view' },
  { label: 'International', path: adminPortalPaths.localInternational, permission: 'leads.view' },
  { label: 'Product waitlist', path: adminPortalPaths.productWaitlist, permission: 'settings.manage' },
  { label: 'Executive', path: adminPortalPaths.executive, permission: 'analytics.view' },
  { label: 'Team access', path: adminPortalPaths.teamAccess, permission: 'employees.view' },
  { label: 'Operations', path: adminPortalPaths.operations, permission: 'analytics.view' },
  { label: 'Sales', path: adminPortalPaths.sales, permission: 'leads.view' },
  { label: 'Revenue', path: adminPortalPaths.revenue, permission: 'invoices.view' },
  { label: 'Customers', path: adminPortalPaths.customers, permission: 'customers.view' },
  { label: 'Employees', path: adminPortalPaths.employees, permission: 'employees.view' },
  { label: 'Projects', path: adminPortalPaths.projects, permission: 'projects.view' },
  { label: 'Tasks', path: adminPortalPaths.tasks, permission: 'tasks.view' },
  { label: 'Proposals', path: adminPortalPaths.proposals, permission: 'proposals.view' },
  { label: 'Invoices', path: adminPortalPaths.invoices, permission: 'invoices.view' },
  { label: 'Payments', path: adminPortalPaths.payments, permission: 'payments.view' },
  { label: 'Files', path: adminPortalPaths.files, permission: 'files.view' },
  { label: 'Messages', path: adminPortalPaths.messages, permission: 'messages.view' },
  { label: 'Support', path: adminPortalPaths.support, permission: 'support.manage' },
  { label: 'Analytics', path: adminPortalPaths.analytics, permission: 'analytics.view' },
  { label: 'Notifications', path: adminPortalPaths.notifications, permission: null },
  { label: 'Audit logs', path: adminPortalPaths.auditLogs, permission: 'audit_logs.view' },
  { label: 'Settings', path: adminPortalPaths.settings, permission: 'settings.manage' },
  { label: 'Security', path: adminPortalPaths.security, permission: null },
]

export function adminNavForPermissions(permissions: string[]) {
  const set = new Set(permissions)
  return adminNav.filter((item) => !item.permission || set.has(item.permission))
}

export const leadStatusOptions = [
  'new',
  'contacted',
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
  'archived',
] as const

export const CRM_PIPELINE_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const
