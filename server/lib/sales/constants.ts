/** Active sales opportunity = qualified lead in pipeline (lead record is the opportunity). */
export const OPEN_OPPORTUNITY_STATUSES = [
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
] as const

export const SALES_PIPELINE_STAGES = [
  'new',
  'contacted',
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  new: 'New lead',
  contacted: 'Contacted',
  qualified: 'Qualified',
  discovery: 'Discovery',
  proposal: 'Scope / proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
  archived: 'Archived',
}

export const MIN_SAMPLE_FOR_AVERAGE_DEAL = 3
export const MIN_SAMPLE_FOR_CONVERSION_RATE = 3
