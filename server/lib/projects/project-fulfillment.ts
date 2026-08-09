export const PROJECT_FULFILLMENT_STATUSES = [
  'draft',
  'active',
  'on_hold',
  'completed',
  'cancelled',
] as const

export type ProjectFulfillmentStatus = (typeof PROJECT_FULFILLMENT_STATUSES)[number]

const BLOCKED_LEAD_STATUSES = new Set(['lost', 'archived'])

export function canCreateProjectFromLead(lead: {
  status: string
  customerId: string | null
}): { ok: true } | { ok: false; reason: string } {
  if (BLOCKED_LEAD_STATUSES.has(lead.status)) {
    return { ok: false, reason: 'Projects cannot be created from lost or archived leads.' }
  }
  if (!lead.customerId) {
    return {
      ok: false,
      reason: 'Link this lead to a customer account before creating a project.',
    }
  }
  return { ok: true }
}

export function presentCustomerProjectStatus(status: string): {
  label: string
  nextStep: string
  lifecycleIndex: number
} {
  switch (status) {
    case 'draft':
      return {
        label: 'Planning',
        nextStep: 'Your project is being reviewed and scoped by the MUCO team.',
        lifecycleIndex: 0,
      }
    case 'active':
      return {
        label: 'In progress',
        nextStep: 'Work is underway. We will share updates as delivery progresses.',
        lifecycleIndex: 1,
      }
    case 'on_hold':
      return {
        label: 'On hold',
        nextStep: 'This project is temporarily paused. Contact us if you have questions.',
        lifecycleIndex: 1,
      }
    case 'completed':
      return {
        label: 'Completed',
        nextStep: 'This project has been marked complete. Thank you for working with MUCO.',
        lifecycleIndex: 2,
      }
    case 'cancelled':
      return {
        label: 'Cancelled',
        nextStep: 'This project was cancelled. Reach out if you would like to discuss next steps.',
        lifecycleIndex: 2,
      }
    default:
      return {
        label: status.replace(/_/g, ' '),
        nextStep: 'Your project is currently being reviewed by the MUCO team.',
        lifecycleIndex: 0,
      }
  }
}
