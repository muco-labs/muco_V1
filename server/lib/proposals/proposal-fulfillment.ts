export const PROPOSAL_OPEN_STATUSES = [
  'draft',
  'sent',
  'viewed',
  'changes_requested',
] as const

export const PROPOSAL_TERMINAL_STATUSES = [
  'accepted',
  'declined',
  'expired',
  'cancelled',
] as const

export function isProposalPastValidity(validUntil: Date | null | undefined, now = new Date()): boolean {
  if (!validUntil) return false
  return validUntil.getTime() < now.getTime()
}

export function isProposalCustomerActionable(
  status: string,
  validUntil: Date | null | undefined,
  now = new Date(),
): boolean {
  if (!['sent', 'viewed', 'changes_requested'].includes(status)) return false
  return !isProposalPastValidity(validUntil, now)
}

export function presentCustomerProposalStatus(
  status: string,
  validUntil: Date | null | undefined,
  now = new Date(),
): { label: string; nextAction: string; expired: boolean } {
  const expired =
    isProposalPastValidity(validUntil, now) &&
    (status === 'sent' || status === 'viewed' || status === 'changes_requested')

  if (expired || status === 'expired') {
    return {
      label: 'Expired',
      nextAction: 'This proposal is no longer valid. Contact MUCO if you need an updated quote.',
      expired: true,
    }
  }

  switch (status) {
    case 'sent':
      return {
        label: 'Awaiting your review',
        nextAction: 'Review scope and pricing, then accept or decline.',
        expired: false,
      }
    case 'viewed':
      return {
        label: 'In review',
        nextAction: 'Accept when ready, or decline if this scope is not a fit.',
        expired: false,
      }
    case 'changes_requested':
      return {
        label: 'Changes requested',
        nextAction: 'MUCO will follow up with an updated proposal.',
        expired: false,
      }
    case 'accepted':
      return {
        label: 'Accepted',
        nextAction: 'Thank you. Our team will coordinate next steps with you.',
        expired: false,
      }
    case 'declined':
      return {
        label: 'Declined',
        nextAction: 'You declined this proposal. Reach out if you would like to revisit scope.',
        expired: false,
      }
    case 'cancelled':
      return {
        label: 'Withdrawn',
        nextAction: 'This proposal was withdrawn by MUCO.',
        expired: false,
      }
    default:
      return {
        label: status.replace(/_/g, ' '),
        nextAction: 'Contact MUCO if you have questions about this proposal.',
        expired: false,
      }
  }
}

export function canCreateProposalForLead(lead: {
  status: string
  customerId: string | null
}): { ok: true } | { ok: false; reason: string } {
  if (lead.status === 'lost' || lead.status === 'archived') {
    return { ok: false, reason: 'Proposals cannot be created from lost or archived leads.' }
  }
  if (!lead.customerId) {
    return {
      ok: false,
      reason: 'Link this lead to a customer account before creating a proposal.',
    }
  }
  return { ok: true }
}
