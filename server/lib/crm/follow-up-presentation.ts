export const OPEN_LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'discovery',
  'proposal',
  'negotiation',
] as const

export type OpenLeadStatus = (typeof OPEN_LEAD_STATUSES)[number]

export const ACTIVE_FOLLOW_UP_STATUSES = ['pending', 'due'] as const

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

export type FollowUpBucket = 'none' | 'today' | 'overdue' | 'upcoming' | 'inactive'

export type FollowUpPresentation = {
  bucket: FollowUpBucket
  label: string
}

export function presentFollowUp(
  followUpAt: Date | string | null | undefined,
  followUpStatus: string | null | undefined,
  now: Date = new Date(),
): FollowUpPresentation {
  if (!followUpAt) {
    return { bucket: 'none', label: 'No follow-up scheduled' }
  }

  const at = followUpAt instanceof Date ? followUpAt : new Date(followUpAt)
  if (Number.isNaN(at.getTime())) {
    return { bucket: 'none', label: 'No follow-up scheduled' }
  }

  const status = followUpStatus ?? 'pending'
  if (status === 'completed' || status === 'cancelled') {
    return {
      bucket: 'inactive',
      label: `Follow-up ${status} · ${at.toLocaleDateString()}`,
    }
  }

  const startToday = startOfLocalDay(now)
  const endToday = endOfLocalDay(now)

  if (at < startToday) {
    const days = Math.max(
      1,
      Math.round((startToday.getTime() - startOfLocalDay(at).getTime()) / 86_400_000),
    )
    return {
      bucket: 'overdue',
      label: days === 1 ? 'Overdue by 1 day' : `Overdue by ${days} days`,
    }
  }

  if (at >= startToday && at <= endToday) {
    return { bucket: 'today', label: 'Follow up today' }
  }

  const tomorrow = new Date(startToday)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const endTomorrow = endOfLocalDay(tomorrow)
  if (at >= startToday && at <= endTomorrow && at > endToday) {
    return { bucket: 'upcoming', label: 'Follow up tomorrow' }
  }

  return {
    bucket: 'upcoming',
    label: `Upcoming — ${at.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
  }
}

export function parseFollowUpAtInput(value: string): Date {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('Follow-up date is required.')
  }
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid follow-up date.')
  }
  return parsed
}
