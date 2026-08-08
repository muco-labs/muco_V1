import { Hono } from 'hono'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import {
  createProductWaitlistSchema,
  formatZodErrors,
} from '../../lib/validation/product-waitlist.js'
import { createProductWaitlistEntry } from '../../services/product-waitlist.service.js'

export const productRoutes = new Hono()

productRoutes.post('/waitlist', async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/product/waitlist',
      ),
      { max: 8, windowMs: 15 * 60 * 1000 },
    )
    if (!limit.allowed) {
      throw new AppError(
        'RATE_LIMITED',
        'Too many requests. Please wait a moment and try again.',
        429,
      )
    }

    const body = await c.req.json().catch(() => null)

    if (body && typeof body === 'object' && 'website' in body) {
      const honeypot = String((body as { website?: string }).website ?? '').trim()
      if (honeypot) {
        return jsonSuccess(c, { id: 'accepted', alreadyRegistered: false }, 201)
      }
    }

    const parsed = createProductWaitlistSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Please check the form and try again.',
        400,
        formatZodErrors(parsed.error),
      )
    }

    if (!parsed.data.marketingConsent) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Consent is required to join the waitlist.',
        400,
      )
    }

    const result = await createProductWaitlistEntry(parsed.data)
    return jsonSuccess(c, result, result.alreadyRegistered ? 200 : 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})
