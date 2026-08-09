import { and, eq, isNull, ne, or, type SQL } from 'drizzle-orm'
import { leads } from '../../db/schema.js'
import { PROJECT_INTAKE_PAGE_SOURCE } from './project-intake-constants.js'

export type LeadEntryChannel = 'start_project' | 'contact' | 'other'

const CONTACT_PAGE_SOURCES = new Set(['contact', 'website_contact'])

export function leadEntryChannel(pageSource: string | null | undefined): LeadEntryChannel {
  if (pageSource === PROJECT_INTAKE_PAGE_SOURCE) return 'start_project'
  if (pageSource && CONTACT_PAGE_SOURCES.has(pageSource)) return 'contact'
  return 'other'
}

export function leadEntryChannelLabel(channel: LeadEntryChannel): string {
  switch (channel) {
    case 'start_project':
      return 'Start Project'
    case 'contact':
      return 'Contact'
    default:
      return 'Other'
  }
}

export function leadChannelFilterCondition(channel: LeadEntryChannel): SQL {
  if (channel === 'start_project') {
    return eq(leads.pageSource, PROJECT_INTAKE_PAGE_SOURCE)
  }
  if (channel === 'contact') {
    return or(eq(leads.pageSource, 'contact'), eq(leads.pageSource, 'website_contact'))!
  }
  return or(
    isNull(leads.pageSource),
    and(
      ne(leads.pageSource, PROJECT_INTAKE_PAGE_SOURCE),
      ne(leads.pageSource, 'contact'),
      ne(leads.pageSource, 'website_contact'),
    )!,
  )!
}
