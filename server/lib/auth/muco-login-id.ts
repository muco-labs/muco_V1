import type { RoleName } from './permissions.js'

const LOGIN_ID_PREFIX: Record<RoleName, string> = {
  CUSTOMER: 'CUS',
  EMPLOYEE: 'EMP',
  FREELANCER: 'FLT',
  ADMIN: 'ADM',
  SUPER_ADMIN: 'ADM',
  FOUNDER: 'ADM',
}

/** Normalize user input for lookup (case-insensitive, optional hyphen). */
export function normalizeMucoLoginId(raw: string): string {
  const trimmed = raw.trim().toUpperCase()
  if (!trimmed) return ''
  if (trimmed.includes('-')) return trimmed.replace(/\s+/g, '')
  const match = /^([A-Z]{3})([A-Z0-9]+)$/.exec(trimmed)
  if (match) return `${match[1]}-${match[2]}`
  return trimmed
}

export function formatMucoLoginId(role: RoleName, suffix: string): string {
  const prefix = LOGIN_ID_PREFIX[role] ?? 'CUS'
  const clean = suffix.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 12)
  return `${prefix}-${clean}`
}

/** Generate a unique suffix from a UUID fragment. */
export function mucoLoginIdSuffixFromUuid(uuid: string): string {
  return uuid.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function isLikelyMucoLoginId(identifier: string): boolean {
  const n = normalizeMucoLoginId(identifier)
  return /^[A-Z]{3}-[A-Z0-9]{4,}$/.test(n)
}
