export const CRM_PIPELINE_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
  'won',
  'lost',
] as const

export type CrmPipelineStatus = (typeof CRM_PIPELINE_STATUSES)[number]

export const LEAD_SOURCES = [
  'WEBSITE',
  'ORGANIC_SEARCH',
  'REFERRAL',
  'SOCIAL',
  'EMAIL',
  'DIRECT',
  'MANUAL',
  'OTHER',
] as const

export type LeadSource = (typeof LEAD_SOURCES)[number]

const sourceAliases: Record<string, LeadSource> = {
  website: 'WEBSITE',
  website_contact: 'WEBSITE',
  contact_form: 'WEBSITE',
  start_project: 'WEBSITE',
  organic_search: 'ORGANIC_SEARCH',
  referral: 'REFERRAL',
  social: 'SOCIAL',
  email: 'EMAIL',
  direct: 'DIRECT',
  manual: 'MANUAL',
  admin: 'MANUAL',
  other: 'OTHER',
}

export function normalizeLeadSource(raw?: string | null): LeadSource {
  if (!raw?.trim()) return 'WEBSITE'
  const key = raw.trim().toLowerCase()
  if (sourceAliases[key]) return sourceAliases[key]
  const upper = raw.trim().toUpperCase()
  if ((LEAD_SOURCES as readonly string[]).includes(upper)) return upper as LeadSource
  return 'OTHER'
}

export function storageSourceValue(source: LeadSource): string {
  return source.toLowerCase()
}

export const INTERACTION_TYPES = ['email', 'call', 'meeting', 'message', 'note', 'other'] as const
