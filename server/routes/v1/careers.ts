import { Hono } from 'hono'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import { createCareerApplicationSchema, careerResumeMetaSchema } from '../../lib/validation/careers.js'
import { formatZodErrors } from '../../lib/validation/leads.js'
import {
  createCareerApplication,
  getPublishedJobOpeningBySlug,
  listPublishedJobOpenings,
  registerCareerResumeUpload,
} from '../../services/careers.service.js'

export const careersRoutes = new Hono()

careersRoutes.get('/openings', async (c) => {
  try {
    return jsonSuccess(c, { items: await listPublishedJobOpenings() })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

careersRoutes.get('/openings/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    return jsonSuccess(c, await getPublishedJobOpeningBySlug(slug))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

careersRoutes.post('/applications', async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/careers/applications',
      ),
    )
    if (!limit.allowed) {
      throw new AppError('RATE_LIMITED', 'Too many requests. Please wait and try again.', 429)
    }

    const body = await c.req.json().catch(() => null)
    if (body && typeof body === 'object' && 'website' in body) {
      const honeypot = String((body as { website?: string }).website ?? '').trim()
      if (honeypot) {
        return jsonSuccess(c, { id: 'accepted', reference: 'APP-ACCEPTED' }, 201)
      }
    }

    const parsed = createCareerApplicationSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Please check the form and try again.',
        400,
        formatZodErrors(parsed.error),
      )
    }

    return jsonSuccess(c, await createCareerApplication(parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

careersRoutes.post('/applications/:id/resume-upload', async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/careers/applications/resume',
      ),
    )
    if (!limit.allowed) {
      throw new AppError('RATE_LIMITED', 'Too many requests. Please wait and try again.', 429)
    }

    const body = await c.req.json().catch(() => null)
    const parsed = careerResumeMetaSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid resume file.', 400, formatZodErrors(parsed.error))
    }

    return jsonSuccess(c, await registerCareerResumeUpload(c.req.param('id'), parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})
