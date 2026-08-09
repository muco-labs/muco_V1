export const PROJECT_DELIVERY_LIFECYCLE = [
  { id: 'planning', label: 'Planning', summary: 'Scope and kickoff with the MUCO team.' },
  { id: 'active', label: 'In progress', summary: 'Delivery work is underway.' },
  { id: 'completed', label: 'Completed', summary: 'Project marked complete.' },
] as const

export function projectLifecycleIndex(status: string): number {
  if (status === 'draft') return 0
  if (status === 'active' || status === 'on_hold') return 1
  if (status === 'completed' || status === 'cancelled') return 2
  return 0
}

export function projectLifecycleStepState(
  stepIndex: number,
  currentIndex: number,
): 'upcoming' | 'current' | 'complete' {
  if (stepIndex < currentIndex) return 'complete'
  if (stepIndex === currentIndex) return 'current'
  return 'upcoming'
}
