import { Hono } from 'hono'
import type { Context } from 'hono'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { requirePermission } from '../../middleware/authenticate.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import {
  createWebsiteAuditSchema,
  formatZodErrors,
} from '../../lib/validation/website-intelligence.js'
import {
  cancelWebsiteAudit,
  createWebsiteAudit,
  getWebsiteAuditReport,
  getWebsiteIntelligenceDashboard,
  listWebsiteAudits,
} from '../../services/website-intelligence.service.js'

function paramId(c: Context, key = 'id') {
  const id = c.req.param(key)
  if (!id?.trim()) throw new AppError('VALIDATION_ERROR', 'Invalid id.', 400)
  return id
}

export const websiteIntelligenceRoutes = new Hono()

websiteIntelligenceRoutes.get('/dashboard', requirePermission('website_intelligence.view'), async (c) => {
  try {
    return jsonSuccess(c, await getWebsiteIntelligenceDashboard())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

websiteIntelligenceRoutes.get('/audits', requirePermission('website_intelligence.view'), async (c) => {
  try {
    const items = await listWebsiteAudits({
      q: c.req.query('q'),
      status: c.req.query('status'),
    })
    return jsonSuccess(c, { items })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

websiteIntelligenceRoutes.post('/audits', requirePermission('website_intelligence.run'), async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/admin/website-intelligence/audits',
      ),
      { max: 6, windowMs: 60 * 60 * 1000 },
    )
    if (!limit.allowed) {
      throw new AppError('RATE_LIMITED', 'Too many audits. Please wait and try again.', 429)
    }

    const body = await c.req.json().catch(() => null)
    const parsed = createWebsiteAuditSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid audit request.', 400, formatZodErrors(parsed.error))
    }

    const auth = c.get('auth')
    const result = await createWebsiteAudit(auth.userId, parsed.data)
    return jsonSuccess(c, result, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

websiteIntelligenceRoutes.get('/audits/:id', requirePermission('website_intelligence.view'), async (c) => {
  try {
    return jsonSuccess(c, await getWebsiteAuditReport(paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

websiteIntelligenceRoutes.get(
  '/audits/:id/export',
  requirePermission('website_intelligence.view'),
  async (c) => {
    try {
      const report = await getWebsiteAuditReport(paramId(c))
      return jsonSuccess(c, { format: 'json', report })
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

websiteIntelligenceRoutes.post(
  '/audits/:id/cancel',
  requirePermission('website_intelligence.run'),
  async (c) => {
    try {
      await cancelWebsiteAudit(paramId(c))
      return jsonSuccess(c, { cancelled: true })
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)
