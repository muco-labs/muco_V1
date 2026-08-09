import { Hono } from 'hono'
import { z } from 'zod'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { authenticate, requirePortal } from '../../middleware/authenticate.js'
import {
  freelancerAvailabilitySchema,
  freelancerProfileUpdateSchema,
  freelancerServiceCreateSchema,
  freelancerServiceUpdateSchema,
  freelancerSkillCreateSchema,
} from '../../lib/validation/freelancers.js'
import { formatZodErrors } from '../../lib/validation/auth.js'
import {
  getFreelancerPortalProfile,
  updateFreelancerAvailability,
  updateFreelancerPortalProfile,
} from '../../services/freelancer-network.service.js'
import {
  getFreelancerAssignedProject,
  getFreelancerAssignedTask,
  listFreelancerAssignedProjects,
  listFreelancerAssignedTasks,
  updateFreelancerTaskStatus,
} from '../../services/freelancer-delivery.service.js'
import {
  createFreelancerServicePortal,
  createFreelancerSkillPortal,
  deleteFreelancerServicePortal,
  deleteFreelancerSkillPortal,
  getMucoServiceCatalogForPortal,
  listFreelancerServicesPortal,
  listFreelancerSkillsPortal,
  updateFreelancerServicePortal,
} from '../../services/freelancer-offerings.service.js'
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
    const projects = await listFreelancerAssignedProjects(auth)
    return jsonSuccess(c, {
      profile,
      projects,
      assignmentsMessage:
        projects.length === 0
          ? 'Assignments will appear here when MUCO Labs assigns a project to you.'
          : null,
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const freelancerTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']),
})

freelancerRoutes.get('/projects', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await listFreelancerAssignedProjects(auth) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.get('/projects/:id', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const id = c.req.param('id')
    if (!id) throw new AppError('VALIDATION_ERROR', 'Project id required.', 400)
    return jsonSuccess(c, await getFreelancerAssignedProject(auth, id))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.get('/tasks', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const projectId = c.req.query('projectId')
    return jsonSuccess(c, {
      items: await listFreelancerAssignedTasks(auth, projectId || undefined),
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.get('/tasks/:taskId', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const taskId = c.req.param('taskId')
    if (!taskId) throw new AppError('VALIDATION_ERROR', 'Task id required.', 400)
    return jsonSuccess(c, await getFreelancerAssignedTask(auth, taskId))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.patch('/tasks/:taskId', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const taskId = c.req.param('taskId')
    if (!taskId) throw new AppError('VALIDATION_ERROR', 'Task id required.', 400)
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerTaskStatusSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid task update.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(c, await updateFreelancerTaskStatus(auth, taskId, parsed.data.status))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.get('/services/catalog', ...stack, async (c) => {
  try {
    return jsonSuccess(c, getMucoServiceCatalogForPortal())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.get('/services', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await listFreelancerServicesPortal(auth) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.post('/services', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerServiceCreateSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid service.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(c, await createFreelancerServicePortal(auth, parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.patch('/services/:id', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const id = c.req.param('id')
    if (!id) throw new AppError('VALIDATION_ERROR', 'Service id required.', 400)
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerServiceUpdateSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid service update.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(c, await updateFreelancerServicePortal(auth, id, parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.delete('/services/:id', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const id = c.req.param('id')
    if (!id) throw new AppError('VALIDATION_ERROR', 'Service id required.', 400)
    return jsonSuccess(c, await deleteFreelancerServicePortal(auth, id))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.get('/skills', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await listFreelancerSkillsPortal(auth) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.post('/skills', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerSkillCreateSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid skill.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(c, await createFreelancerSkillPortal(auth, parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

freelancerRoutes.delete('/skills/:id', ...stack, async (c) => {
  try {
    const auth = c.get('auth')
    const id = c.req.param('id')
    if (!id) throw new AppError('VALIDATION_ERROR', 'Skill id required.', 400)
    return jsonSuccess(c, await deleteFreelancerSkillPortal(auth, id))
  } catch (error) {
    return handleRouteError(c, error)
  }
})
