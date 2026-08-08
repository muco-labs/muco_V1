import { env } from '@/config/env'
import { apiRequest } from '@/services/api'
import { validateContactPayload, type SanitizedContactPayload } from '@/utils/validate'

export type ContactPayload = SanitizedContactPayload

export type ContactSubmitInput = {
  name: string
  email: string
  company?: string
  message: string
  /** Honeypot — must stay empty; bots often fill hidden fields. */
  website?: string
}

export type ContactResult = { ok: true } | { ok: false; error: string }

export async function submitContact(
  input: ContactSubmitInput,
): Promise<ContactResult> {
  if (input.website?.trim()) {
    return { ok: true }
  }

  const validation = validateContactPayload(input)
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
      json: validation.data,
    })
    return { ok: true }
  } catch {
    return { ok: false, error: 'Unable to send your message. Try again later.' }
  }
}
