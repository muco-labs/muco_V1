export type CustomerStatusTone = 'pending' | 'active' | 'complete' | 'cancelled'

export type CustomerRequestPresentation = {
  label: string
  headline: string
  description: string
  tone: CustomerStatusTone
  lifecycleIndex: number
}

/** Conceptual lifecycle for customer UI (presentation only). */
export const PROJECT_REQUEST_LIFECYCLE = [
  {
    id: 'submitted',
    label: 'Request submitted',
    summary: 'Your requirements are on file with MUCO Labs.',
  },
  {
    id: 'review',
    label: 'MUCO review',
    summary: 'Our team reviews scope, fit, and next steps.',
  },
  {
    id: 'planning',
    label: 'Planning & quote',
    summary: 'Scope, timeline, and proposal when applicable.',
  },
  {
    id: 'project',
    label: 'Project',
    summary: 'Delivery work tracked as an active project.',
  },
  {
    id: 'completed',
    label: 'Completed',
    summary: 'Engagement wrapped or request closed.',
  },
] as const

const LEAD_STATUS_MAP: Record<string, CustomerRequestPresentation> = {
  new: {
    label: 'Submitted',
    headline: 'Submitted',
    description:
      'Your project request has been received. The MUCO Labs team will review your requirements.',
    tone: 'active',
    lifecycleIndex: 1,
  },
  contacted: {
    label: 'Under review',
    headline: 'Contacted',
    description: 'We are in touch about your request. Watch for updates from our team.',
    tone: 'active',
    lifecycleIndex: 1,
  },
  qualified: {
    label: 'Planning',
    headline: 'Qualified',
    description: 'Your request has been qualified. We will share next steps when ready.',
    tone: 'active',
    lifecycleIndex: 2,
  },
  discovery: {
    label: 'Planning',
    headline: 'Discovery',
    description: 'We are clarifying scope and approach for your project.',
    tone: 'active',
    lifecycleIndex: 2,
  },
  proposal: {
    label: 'Planning',
    headline: 'Proposal',
    description: 'A proposal or quote may be prepared based on your requirements.',
    tone: 'active',
    lifecycleIndex: 2,
  },
  negotiation: {
    label: 'Planning',
    headline: 'In discussion',
    description: 'We are aligning on scope, timeline, or commercial terms.',
    tone: 'active',
    lifecycleIndex: 2,
  },
  won: {
    label: 'In progress',
    headline: 'Project confirmed',
    description: 'This request progressed to an active project. See Projects for delivery status.',
    tone: 'complete',
    lifecycleIndex: 3,
  },
  lost: {
    label: 'Closed',
    headline: 'Not proceeding',
    description: 'This request is closed. Contact us if you would like to start again.',
    tone: 'cancelled',
    lifecycleIndex: 0,
  },
  archived: {
    label: 'Closed',
    headline: 'Archived',
    description: 'This request is archived for your records.',
    tone: 'cancelled',
    lifecycleIndex: 0,
  },
}

export function presentProjectRequestStatus(status: string): CustomerRequestPresentation {
  const mapped = LEAD_STATUS_MAP[status]
  if (mapped) return mapped
  const label = status.replace(/_/g, ' ')
  return {
    label,
    headline: label,
    description: 'Status updates will appear here when available.',
    tone: 'pending',
    lifecycleIndex: 0,
  }
}

export function projectRequestStatusLabel(status: string): string {
  return presentProjectRequestStatus(status).label
}

export function projectRequestNextAction(status: string): string {
  switch (status) {
    case 'new':
      return 'Wait for MUCO Labs review.'
    case 'contacted':
    case 'qualified':
      return 'Respond when our team reaches out.'
    case 'discovery':
    case 'proposal':
    case 'negotiation':
      return 'Review information or proposals when shared.'
    case 'won':
      return 'Continue in Projects for delivery updates.'
    case 'lost':
    case 'archived':
      return 'Start a new request if your needs change.'
    default:
      return 'MUCO Labs will contact you with the next step.'
  }
}

export function lifecycleStepState(
  stepIndex: number,
  currentIndex: number,
  tone: CustomerStatusTone,
): 'complete' | 'current' | 'pending' | 'cancelled' {
  if (tone === 'cancelled') {
    return stepIndex === 0 ? 'current' : 'pending'
  }
  if (stepIndex < currentIndex) return 'complete'
  if (stepIndex === currentIndex) return 'current'
  return 'pending'
}
