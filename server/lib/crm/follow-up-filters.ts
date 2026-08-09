import { and, gte, gt, inArray, isNull, lte, lt, type SQL } from 'drizzle-orm'
import { leads } from '../../db/schema.js'
import { ACTIVE_FOLLOW_UP_STATUSES, OPEN_LEAD_STATUSES } from './follow-up-presentation.js'

export type FollowUpListFilter = 'overdue' | 'today' | 'upcoming' | 'none'

function openLeadCondition(): SQL {
  return inArray(leads.status, [...OPEN_LEAD_STATUSES])
}

function activeFollowUpCondition(): SQL {
  return inArray(leads.followUpStatus, [...ACTIVE_FOLLOW_UP_STATUSES])
}

function startOfLocalDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfLocalDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

export function followUpListFilterCondition(filter: FollowUpListFilter, now = new Date()): SQL {
  const open = openLeadCondition()
  const startToday = startOfLocalDay(now)
  const endToday = endOfLocalDay(now)

  switch (filter) {
    case 'overdue':
      return and(open, activeFollowUpCondition(), lt(leads.followUpAt, startToday))!
    case 'today':
      return and(
        open,
        activeFollowUpCondition(),
        gte(leads.followUpAt, startToday),
        lte(leads.followUpAt, endToday),
      )!
    case 'upcoming':
      return and(open, activeFollowUpCondition(), gt(leads.followUpAt, endToday))!
    case 'none':
      return and(open, isNull(leads.followUpAt))!
    default:
      return open
  }
}
