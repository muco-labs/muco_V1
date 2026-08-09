import { Hono } from 'hono'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import { formatZodErrors } from '../../lib/validation/auth.js'
import { freelancerApplySchema } from '../../lib/validation/freelancers.js'
import { createFreelancerApplication } from '../../services/freelancer-network.service.js'
import { FREELANCER_SERVICE_CATEGORIES } from '../../lib/freelancers/service-categories.js'

export const freelancersPublicRoutes = new Hono()

freelancersPublicRoutes.get('/service-categories', async (c) => {
  return jsonSuccess(c, { items: FREELANCER_SERVICE_CATEGORIES })
})

freelancersPublicRoutes.post('/apply', async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/freelancers/apply',
      ),
    )
    if (!limit.allowed) {
      throw new AppError('RATE_LIMITED', 'Too many requests. Please try again later.', 429)
    }

    const body = await c.req.json().catch(() => null)
    const parsed = freelancerApplySchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Please check the form.', 400, formatZodErrors(parsed.error))
    }

    return jsonSuccess(c, await createFreelancerApplication(parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})
