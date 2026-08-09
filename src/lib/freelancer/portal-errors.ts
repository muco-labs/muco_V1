export {
  friendlyCustomerPortalError as friendlyFreelancerPortalError,
  type PortalStatusTone,
} from '@/lib/customer/portal-errors'

import type { PortalStatusTone } from '@/lib/customer/portal-errors'

export function availabilityStatusTone(status: string): PortalStatusTone {
  const s = status.toLowerCase()
  if (s === 'available') return 'success'
  if (s === 'limited') return 'warning'
  if (s === 'unavailable') return 'muted'
  return 'default'
}

export function approvalStatusLabel(status: string): string {
  const s = status.toLowerCase()
  if (s === 'approved') return 'Approved — portal access active'
  if (s === 'pending') return 'Pending — application under review'
  if (s === 'rejected') return 'Not approved — contact MUCO if you have questions'
  return status.replace(/_/g, ' ')
}
