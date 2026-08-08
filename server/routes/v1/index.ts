import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createLeadSchema, formatZodErrors } from '../../lib/validation/leads.js'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { createLeadFromWebsite } from '../../services/leads.service.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import { serverEnv } from '../../lib/env.js'
import { authRoutes } from './auth.js'
import { adminRoutes } from './admin.js'
import { customerRoutes } from './customer.js'
import { employeeRoutes } from './employee.js'
import { webhookRoutes } from './webhooks.js'
import { authenticate, requirePermission } from '../../middleware/authenticate.js'

export const v1 = new Hono()

v1.post('/leads', async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/leads',
      ),
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
        return jsonSuccess(c, { id: 'accepted', status: 'new' as const }, 201)
      }
    }

    const parsed = createLeadSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Please check the form and try again.',
        400,
        formatZodErrors(parsed.error),
      )
    }

    const lead = await createLeadFromWebsite(parsed.data)
    return jsonSuccess(c, lead, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

v1.route('/auth', authRoutes)
v1.route('/webhooks', webhookRoutes)
v1.route('/admin', adminRoutes)
v1.route('/customer', customerRoutes)
v1.route('/employee', employeeRoutes)

v1.get('/projects', authenticate, requirePermission('projects.view'), async (c) => {
  return jsonSuccess(c, { items: [], message: 'Project APIs will expand in a later phase.' })
})

export function createV1App() {
  const app = new Hono()

  if (serverEnv.corsOrigins.length > 0) {
    app.use(
      '*',
      cors({
        origin: serverEnv.corsOrigins,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      }),
    )
  }

  app.route('/v1', v1)

  return app
}
