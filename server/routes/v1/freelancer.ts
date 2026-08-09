import { Hono } from 'hono'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { authenticate, requirePortal } from '../../middleware/authenticate.js'
import {
  freelancerAvailabilitySchema,
  freelancerProfileUpdateSchema,
} from '../../lib/validation/freelancers.js'
import { formatZodErrors } from '../../lib/validation/auth.js'
import {
  getFreelancerPortalProfile,
  updateFreelancerAvailability,
  updateFreelancerPortalProfile,
} from '../../services/freelancer-network.service.js'
import { parsePortfolioUrls } from '../../lib/freelancers/portfolio-url.js'

export const freelancerRoutes = new Hono()

const stack = [authenticate, requirePortal('freelancer')] as const

freelancerRoutes.get('/profile', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getFreelancerPortalProfile(auth))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.patch('/profile', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerProfileUpdateSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid profile update.', 400, formatZodErrors(parsed.error))
    }
    const portfolioUrls =
      parsed.data.portfolioUrls === undefined
        ? undefined
        : parsePortfolioUrls(parsed.data.portfolioUrls)
    return jsonSuccess(
      c,
      await updateFreelancerPortalProfile(auth, {
        ...parsed.data,
        portfolioUrls,
      }),
    )
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.patch('/availability', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerAvailabilitySchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid availability.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(c, await updateFreelancerAvailability(auth, parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.get('/dashboard', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const profile = await getFreelancerPortalProfile(auth)
    return jsonSuccess(c, {
      profile,
      assignments: [],
      assignmentsMessage:
        'Assignments will appear here when MUCO Labs assigns a project to you.',
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})
