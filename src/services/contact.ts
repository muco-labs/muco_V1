import { env } from '@/config/env'
import {
  attributionPayloadForLead,
  attributionSummaryForLead,
  leadSourceFromAttribution,
} from '@/lib/analytics/attribution'
import { ApiError, apiRequest } from '@/services/api'
import { validateContactPayload, type SanitizedContactPayload } from '@/utils/validate'

export type ContactPayload = SanitizedContactPayload

export type ContactSubmitInput = {
  name: string
  email: string
  company?: string
  phone?: string
  message: string
  serviceInterest?: string
  budget?: string
  timeline?: string
  pageSource?: string
  businessCity?: string
  businessState?: string
  website?: string
}

export type ContactResult =
  | { ok: true; leadId?: string; reInquiry?: boolean }
  | { ok: false; error: string }

export async function submitContact(input: ContactSubmitInput): Promise<ContactResult> {
  if (input.website?.trim()) {
    return { ok: true }
  }

  const validation = validateContactPayload(input)
  if (!validation.ok) return validation

  const attributionNote = attributionSummaryForLead()
  const messageBody =
    attributionNote && !validation.data.message.includes(attributionNote)
      ? `${validation.data.message}\n\n—\nContext: ${attributionNote}`
      : validation.data.message

  const source = leadSourceFromAttribution(input.pageSource)
  const attribution = attributionPayloadForLead(input.pageSource)

  try {
    const response = await apiRequest<{ id: string; status: string; reInquiry?: boolean }>(
      env.contactApiUrl,
      {
        method: 'POST',
        json: {
          name: validation.data.name,
          email: validation.data.email,
          company: validation.data.company || undefined,
          phone: validation.data.phone || undefined,
          message: messageBody,
          serviceInterest: validation.data.serviceInterest || undefined,
          budget: validation.data.budget || undefined,
          timeline: validation.data.timeline || undefined,
          businessCity: validation.data.businessCity || undefined,
          businessState: validation.data.businessState || undefined,
          website: input.website ?? '',
          source,
          ...attribution,
        },
      },
    )
    return { ok: true, leadId: response.id, reInquiry: response.reInquiry }
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Unable to send your message. Try again later.' }
  }
}
