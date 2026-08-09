import { adminPortalPaths } from '@/config/admin-portal'
import { customerPortalPaths } from '@/config/customer-portal'
import { employeePortalPaths } from '@/config/employee-portal'

export type PortalKind = 'customer' | 'employee' | 'admin'

/** Map known notification types to in-app routes. Unknown types return null (no dead link). */
export function notificationHref(portal: PortalKind, type: string): string | null {
  const t = type.trim().toLowerCase()
  if (portal === 'customer') {
    if (t.startsWith('conversation.')) return customerPortalPaths.messages
    if (t.startsWith('proposal')) return customerPortalPaths.proposals
    if (t.startsWith('project.') || t.startsWith('milestone.')) return customerPortalPaths.projects
    if (t.startsWith('payment.')) return customerPortalPaths.invoices
    return null
  }
  if (portal === 'employee') {
    if (t.startsWith('task.')) return employeePortalPaths.tasks
    if (t.startsWith('project.')) return employeePortalPaths.projects
    if (t.startsWith('conversation.')) return employeePortalPaths.messages
    return null
  }
  if (portal === 'admin') {
    if (t.startsWith('crm.') || t.includes('lead')) return adminPortalPaths.leads
    if (t.startsWith('project.') || t === 'projects.created') return adminPortalPaths.projects
    if (t.startsWith('proposal') || t.startsWith('proposals.')) return adminPortalPaths.proposals
    if (t.startsWith('invoice.') || t.startsWith('payment.')) return adminPortalPaths.invoices
    if (t.startsWith('freelancer.')) return adminPortalPaths.freelancers
    if (t.startsWith('conversation.')) return adminPortalPaths.messages
    if (t.startsWith('careers.')) return adminPortalPaths.careers
    return null
  }
  return null
}
