const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const contactFieldLimits = {
  name: 120,
  email: 254,
  company: 160,
  phone: 32,
  message: 4000,
  serviceInterest: 120,
  budget: 80,
  timeline: 120,
} as const

function stripControlCharacters(value: string): string {
  let result = ''
  for (const character of value) {
    const code = character.charCodeAt(0)
    const isControl =
      code <= 0x08 ||
      code === 0x0b ||
      code === 0x0c ||
      (code >= 0x0e && code <= 0x1f) ||
      code === 0x7f
    if (!isControl) result += character
  }
  return result
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed || trimmed.length > contactFieldLimits.email) return false
  return EMAIL_PATTERN.test(trimmed)
}

export function sanitizeTextInput(value: string, maxLength: number): string {
  return stripControlCharacters(value).trim().slice(0, maxLength)
}

export type SanitizedContactPayload = {
  name: string
  email: string
  company: string
  phone: string
  message: string
  serviceInterest: string
  budget: string
  timeline: string
}

export function sanitizeContactPayload(payload: {
  name: string
  email: string
  company?: string
  phone?: string
  message: string
  serviceInterest?: string
  budget?: string
  timeline?: string
}): SanitizedContactPayload {
  return {
    name: sanitizeTextInput(payload.name, contactFieldLimits.name),
    email: sanitizeTextInput(payload.email, contactFieldLimits.email),
    company: sanitizeTextInput(payload.company ?? '', contactFieldLimits.company),
    phone: sanitizeTextInput(payload.phone ?? '', contactFieldLimits.phone),
    message: sanitizeTextInput(payload.message, contactFieldLimits.message),
    serviceInterest: sanitizeTextInput(
      payload.serviceInterest ?? '',
      contactFieldLimits.serviceInterest,
    ),
    budget: sanitizeTextInput(payload.budget ?? '', contactFieldLimits.budget),
    timeline: sanitizeTextInput(payload.timeline ?? '', contactFieldLimits.timeline),
  }
}

export type ContactValidationResult =
  | { ok: true; data: SanitizedContactPayload }
  | { ok: false; error: string }

export function validateContactPayload(payload: {
  name: string
  email: string
  company?: string
  phone?: string
  message: string
  serviceInterest?: string
  budget?: string
  timeline?: string
}): ContactValidationResult {
  const data = sanitizeContactPayload(payload)

  if (!data.name) return { ok: false, error: 'Name is required.' }
  if (!isValidEmail(data.email)) return { ok: false, error: 'Enter a valid email.' }
  if (!data.message) return { ok: false, error: 'Message is required.' }

  return { ok: true, data }
}
