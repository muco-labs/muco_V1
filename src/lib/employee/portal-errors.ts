import type { PortalStatusTone } from '@/lib/customer/portal-errors'

export {
  friendlyCustomerPortalError as friendlyEmployeePortalError,
  type PortalStatusTone,
} from '@/lib/customer/portal-errors'

export function taskStatusTone(status: string): PortalStatusTone {
  const s = status.toLowerCase()
  if (s === 'done' || s === 'completed') return 'success'
  if (s === 'blocked') return 'danger'
  if (s === 'in_progress') return 'warning'
  return 'default'
}
