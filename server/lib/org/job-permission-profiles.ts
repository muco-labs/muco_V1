import type { PermissionName } from '../auth/permissions.js'

/**
 * Recommended permission bundles for job functions.
 * Roles in the database remain EMPLOYEE / ADMIN / FOUNDER — these guide least-privilege hiring.
 */
export const jobPermissionProfiles = {
  engineering: [
    'projects.view',
    'tasks.view',
    'tasks.create',
    'tasks.update',
    'files.view',
    'files.upload',
    'messages.view',
    'messages.send',
    'support.view',
  ],
  design: [
    'projects.view',
    'tasks.view',
    'tasks.update',
    'files.view',
    'files.upload',
    'messages.view',
    'messages.send',
  ],
  sales: [
    'leads.view',
    'leads.update',
    'leads.assign',
    'proposals.view',
    'proposals.create',
    'proposals.update',
    'proposals.send',
    'messages.view',
    'messages.send',
  ],
  marketing: ['leads.view', 'analytics.view', 'messages.view'],
  customer_success: [
    'customers.view',
    'projects.view',
    'support.view',
    'support.manage',
    'messages.view',
    'messages.send',
  ],
  support: ['support.view', 'support.manage', 'customers.view', 'messages.view', 'messages.send'],
  finance: [
    'invoices.view',
    'invoices.create',
    'invoices.update',
    'payments.view',
    'payments.manage',
    'proposals.view',
  ],
  product: ['projects.view', 'tasks.view', 'analytics.view', 'settings.manage'],
} as const satisfies Record<string, PermissionName[]>

export type JobPermissionProfileKey = keyof typeof jobPermissionProfiles
