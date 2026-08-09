/** Customer-facing reference from internal lead id (UUID). */
export function formatProjectRequestReference(id: string): string {
  const normalized = id.replace(/-/g, '').slice(0, 8).toUpperCase()
  return normalized.length >= 8 ? `REQ-${normalized}` : `REQ-${id.slice(0, 12)}`
}

export function projectRequestStatusLabel(status: string): string {
  switch (status) {
    case 'new':
      return 'Awaiting MUCO review'
    case 'contacted':
      return 'In contact'
    case 'qualified':
      return 'Qualified'
    case 'converted':
      return 'Converted to project'
    case 'lost':
      return 'Closed'
    default:
      return status.replace(/_/g, ' ')
  }
}

export function projectRequestNextAction(status: string): string {
  switch (status) {
    case 'new':
      return 'Our team is reviewing your requirements. We will reach out with next steps.'
    case 'contacted':
    case 'qualified':
      return 'Continue the conversation with our team when we contact you.'
    default:
      return 'Check back here for updates on your request.'
  }
}
