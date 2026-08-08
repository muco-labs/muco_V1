export const PROJECT_OPERATIONAL_PHASES = [
  'discovery',
  'planning',
  'design',
  'development',
  'testing',
  'review',
  'deployment',
  'completed',
] as const

export const FILE_VISIBILITY = {
  internal: 'internal',
  customerVisible: 'customer_visible',
  deliverable: 'deliverable',
} as const

export const CUSTOMER_FILE_VISIBILITIES = new Set([
  FILE_VISIBILITY.customerVisible,
  FILE_VISIBILITY.deliverable,
])
