import { Hono } from 'hono'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import {
  authenticate,
  requirePermission,
} from '../../middleware/authenticate.js'
import {
  formatZodErrors,
  inviteEmployeeSchema,
  updateUserStatusSchema,
} from '../../lib/validation/auth.js'
import { inviteEmployee, setUserStatus } from '../../services/auth.service.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import { serverEnv } from '../../lib/env.js'
import { bootstrapFounderAccount } from '../../services/auth.service.js'
import { z } from 'zod'

export const adminRoutes = new Hono()

adminRoutes.use('*', authenticate)

adminRoutes.post('/employees/invite', requirePermission('employees.create'), async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/admin/employees/invite',
      ),
    )
    if (!limit.allowed) {
      throw new AppError('RATE_LIMITED', 'Too many requests. Please wait and try again.', 429)
    }

    const body = await c.req.json().catch(() => null)
    const parsed = inviteEmployeeSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Please check the form and try again.',
        400,
        formatZodErrors(parsed.error),
      )
    }

    const auth = c.get('auth')
    const result = await inviteEmployee({
      ...parsed.data,
      invitedByUserId: auth.userId,
    })

    return jsonSuccess(c, result, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/users/:userId/status', requirePermission('users.disable'), async (c) => {
  try {
    const userId = c.req.param('userId')
    if (!userId) {
      throw new AppError('VALIDATION_ERROR', 'User id is required.', 400)
    }
    const body = await c.req.json().catch(() => null)
    const parsed = updateUserStatusSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid status.',
        400,
        formatZodErrors(parsed.error),
      )
    }

    const auth = c.get('auth')
    if (auth.userId === userId && parsed.data.status !== 'active') {
      throw new AppError('FORBIDDEN', 'You cannot deactivate your own account.', 403)
    }

    await setUserStatus(userId, parsed.data.status, auth.userId)
    return jsonSuccess(c, { userId, status: parsed.data.status })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const bootstrapSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(120),
  bootstrapSecret: z.string().min(8),
})

adminRoutes.post('/bootstrap/founder', async (c) => {
  try {
    if (!serverEnv.bootstrapSecret) {
      throw new AppError('NOT_FOUND', 'Not found.', 404)
    }

    const body = await c.req.json().catch(() => null)
    const parsed = bootstrapSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid request.', 400, formatZodErrors(parsed.error))
    }

    if (parsed.data.bootstrapSecret !== serverEnv.bootstrapSecret) {
      throw new AppError('FORBIDDEN', 'Not allowed.', 403)
    }

    const result = await bootstrapFounderAccount(parsed.data.email, parsed.data.fullName)
    return jsonSuccess(c, { invited: true, userId: result.userId }, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})
