import { env } from '@/config/env'
import { ApiError, apiRequest } from '@/services/api'
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

  try {
    await apiRequest<{ id: string; status: string }>(env.contactApiUrl, {
      method: 'POST',
      json: {
        name: validation.data.name,
        email: validation.data.email,
        company: validation.data.company,
        message: validation.data.message,
        website: input.website ?? '',
        source: 'website_contact',
      },
    })
    return { ok: true }
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Unable to send your message. Try again later.' }
  }
}
