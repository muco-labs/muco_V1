export function formatFreelancerReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `FL-${normalized}` : `FL-${id.slice(0, 12)}`
}

export function canFreelancerSetAvailability(input: {
  verificationStatus: string
  approvalStatus: string
}): boolean {
  return input.verificationStatus === 'verified' && input.approvalStatus === 'approved'
}

export function canTransitionVerification(from: string, to: string): boolean {
  if (from === to) return true
  if (from === 'verified' && to === 'pending') return false
  return ['pending', 'verified', 'failed'].includes(to)
}

export function canTransitionApproval(from: string, to: string): boolean {
  if (from === to) return true
  const allowed: Record<string, string[]> = {
    under_review: ['approved', 'rejected', 'suspended'],
    approved: ['suspended', 'under_review'],
    rejected: ['under_review'],
    suspended: ['approved', 'under_review', 'rejected'],
  }
  return allowed[from]?.includes(to) ?? false
}
