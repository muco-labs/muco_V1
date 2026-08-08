import { ApiError, apiRequest } from '@/services/api'

export type ProductWaitlistInput = {
  productSlug: string
  email: string
  fullName: string
  company?: string
  useCase?: string
  marketingConsent: boolean
  sourcePath?: string
  website?: string
}

export type ProductWaitlistResult =
  | { ok: true; alreadyRegistered: boolean }
  | { ok: false; error: string }

export async function submitProductWaitlist(
  input: ProductWaitlistInput,
): Promise<ProductWaitlistResult> {
  if (input.website?.trim()) {
    return { ok: true, alreadyRegistered: false }
  }

  if (!input.marketingConsent) {
    return { ok: false, error: 'Please confirm consent to join the waitlist.' }
  }

  if (!input.fullName.trim() || !input.email.trim()) {
    return { ok: false, error: 'Name and email are required.' }
  }

  try {
    const response = await apiRequest<{ alreadyRegistered?: boolean }>(
      '/api/v1/product/waitlist',
      {
        method: 'POST',
        json: {
          productSlug: input.productSlug,
          email: input.email.trim(),
          fullName: input.fullName.trim(),
          company: input.company?.trim() || undefined,
          useCase: input.useCase?.trim() || undefined,
          marketingConsent: true,
          sourcePath: input.sourcePath,
        },
      },
    )
    return { ok: true, alreadyRegistered: Boolean(response.alreadyRegistered) }
  } catch (error) {
    if (error instanceof ApiError) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Something went wrong. Please try again.' }
  }
}
