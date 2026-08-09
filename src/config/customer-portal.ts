import { startProjectPaths } from '@/config/start-project'

export const customerPortalPaths = {
  root: '/app',
  startProject: startProjectPaths.flow,
  requests: startProjectPaths.requests,
  projectRequestDetail: (id: string) => `/app/project-requests/${id}`,
  projects: '/app/projects',
  projectDetail: (id: string) => `/app/projects/${id}`,
  proposals: '/app/proposals',
  proposalDetail: (id: string) => `/app/proposals/${id}`,
  invoices: '/app/invoices',
  invoiceDetail: (id: string) => `/app/invoices/${id}`,
  payments: '/app/payments',
  files: '/app/files',
  messages: '/app/messages',
  support: '/app/support',
  supportDetail: (id: string) => `/app/support/${id}`,
  notifications: '/app/notifications',
  profile: '/app/profile',
  settings: '/app/settings',
} as const

export const customerNav = [
  { label: 'Dashboard', path: customerPortalPaths.root, end: true },
  { label: 'Project requests', path: customerPortalPaths.requests },
  { label: 'Start a project', path: customerPortalPaths.startProject },
  { label: 'Projects', path: customerPortalPaths.projects },
  { label: 'Proposals', path: customerPortalPaths.proposals },
  { label: 'Invoices', path: customerPortalPaths.invoices },
  { label: 'Payments', path: customerPortalPaths.payments },
  { label: 'Files', path: customerPortalPaths.files },
  { label: 'Messages', path: customerPortalPaths.messages },
  { label: 'Support', path: customerPortalPaths.support },
  { label: 'Notifications', path: customerPortalPaths.notifications },
  { label: 'Profile', path: customerPortalPaths.profile },
  { label: 'Settings', path: customerPortalPaths.settings },
] as const
