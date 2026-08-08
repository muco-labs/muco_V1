import { env } from '@/config/env'
import { apiRequest } from '@/services/api'
import { isValidEmail, sanitizeTextInput } from '@/utils/validate'

export type ContactPayload = {
  name: string
  email: string
  company?: string
  message: string
}

export type ContactResult = { ok: true } | { ok: false; error: string }

export function validateContactPayload(payload: ContactPayload): ContactResult {
  const name = sanitizeTextInput(payload.name, 120)
  const email = sanitizeTextInput(payload.email, 254)
  const company = payload.company
    ? sanitizeTextInput(payload.company, 120)
    : undefined
  const message = sanitizeTextInput(payload.message, 4000)

  if (!name) return { ok: false, error: 'Name is required.' }
  if (!isValidEmail(email)) return { ok: false, error: 'Enter a valid email.' }
  if (!message) return { ok: false, error: 'Message is required.' }

  return { ok: true }
}

export async function submitContact(
  payload: ContactPayload,
): Promise<ContactResult> {
  const validation = validateContactPayload(payload)
  if (!validation.ok) return validation

  if (!env.contactApiUrl) {
    return {
      ok: false,
      error: 'Contact delivery is not configured yet. Email us directly.',
    }
  }

  try {
    await apiRequest<void>(env.contactApiUrl, {
      method: 'POST',
      json: payload,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Unable to send your message. Try again later.' }
  }
}
