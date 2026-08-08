import { Hono } from 'hono'
import { z } from 'zod'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import {
  authenticate,
  requirePermission,
  requirePortal,
} from '../../middleware/authenticate.js'
import {
  getLeadDetailCrm,
  listLeadsForCrm,
} from '../../services/crm.service.js'
import {
  getEmployeeDashboard,
  getEmployeeDeadlines,
  getEmployeeFileDownloadUrl,
  getEmployeeProfile,
  getEmployeeProjectDetail,
  getEmployeeTask,
  listEmployeeFiles,
  listEmployeeMessages,
  listEmployeeMilestones,
  listEmployeeNotifications,
  listEmployeeProjects,
  listEmployeeTasks,
  markEmployeeNotificationRead,
  registerEmployeeFileUpload,
  requireEmployeeContext,
  sendEmployeeMessage,
  updateEmployeeProfile,
  updateEmployeeTask,
} from '../../services/employee.service.js'

export const employeeRoutes = new Hono()

const employeeStack = [authenticate, requirePortal('employee')] as const

function paramId(c: { req: { param: (name: string) => string | undefined } }, name = 'id') {
  const value = c.req.param(name)
  if (!value) {
    throw new AppError('VALIDATION_ERROR', 'Missing resource id.', 400)
  }
  return value
}

employeeRoutes.get('/dashboard', ...employeeStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, await getEmployeeDashboard(ctx))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/profile', ...employeeStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, await getEmployeeProfile(ctx))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const profileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  department: z.string().max(120).optional(),
  jobTitle: z.string().max(120).optional(),
})

employeeRoutes.patch('/profile', ...employeeStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Please check your profile details.', 400)
    }
    return jsonSuccess(c, await updateEmployeeProfile(ctx, auth, parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/tasks', ...employeeStack, requirePermission('tasks.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    const items = await listEmployeeTasks(ctx, {
      status: c.req.query('status'),
      priority: c.req.query('priority'),
      search: c.req.query('q'),
      limit: Number(c.req.query('limit') ?? 50),
      offset: Number(c.req.query('offset') ?? 0),
    })
    return jsonSuccess(c, { items })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/tasks/:id', ...employeeStack, requirePermission('tasks.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, await getEmployeeTask(ctx, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const taskUpdateSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']).optional(),
  description: z.string().max(8000).optional(),
})

employeeRoutes.patch(
  '/tasks/:id',
  ...employeeStack,
  requirePermission('tasks.update'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireEmployeeContext(auth)
      const body = await c.req.json().catch(() => null)
      const parsed = taskUpdateSchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid task update.', 400)
      }
      const updated = await updateEmployeeTask(ctx, auth, paramId(c), parsed.data)
      return jsonSuccess(c, updated)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

employeeRoutes.get('/projects', ...employeeStack, requirePermission('projects.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, { items: await listEmployeeProjects(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get(
  '/projects/:id',
  ...employeeStack,
  requirePermission('projects.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireEmployeeContext(auth)
      return jsonSuccess(c, await getEmployeeProjectDetail(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

employeeRoutes.get(
  '/projects/:id/milestones',
  ...employeeStack,
  requirePermission('projects.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireEmployeeContext(auth)
      return jsonSuccess(c, { items: await listEmployeeMilestones(ctx, paramId(c)) })
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

employeeRoutes.get('/files', ...employeeStack, requirePermission('files.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    const projectId = c.req.query('projectId')
    return jsonSuccess(c, { items: await listEmployeeFiles(ctx, projectId) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const uploadSchema = z.object({
  projectId: z.string().uuid(),
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(120),
  fileSizeBytes: z.number().int().positive(),
  category: z.string().max(40).optional(),
})

employeeRoutes.post('/files', ...employeeStack, requirePermission('files.upload'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = uploadSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid file metadata.', 400)
    }
    const data = await registerEmployeeFileUpload(ctx, auth, parsed.data)
    return jsonSuccess(c, data, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/files/:id/download', ...employeeStack, requirePermission('files.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, await getEmployeeFileDownloadUrl(ctx, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/messages', ...employeeStack, requirePermission('messages.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    const projectId = c.req.query('projectId')
    return jsonSuccess(c, { items: await listEmployeeMessages(ctx, projectId) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const messageSchema = z.object({
  body: z.string().min(2).max(8000),
  projectId: z.string().uuid().optional(),
})

employeeRoutes.post('/messages', ...employeeStack, requirePermission('messages.send'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = messageSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid message.', 400)
    }
    const row = await sendEmployeeMessage(ctx, auth, parsed.data)
    return jsonSuccess(c, row, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/notifications', ...employeeStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, { items: await listEmployeeNotifications(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.patch('/notifications/:id/read', ...employeeStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, await markEmployeeNotificationRead(ctx, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/deadlines', ...employeeStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireEmployeeContext(auth)
    return jsonSuccess(c, { items: await getEmployeeDeadlines(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/leads', ...employeeStack, requirePermission('leads.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const items = await listLeadsForCrm(auth, {
      q: c.req.query('q'),
      status: c.req.query('status'),
      limit: 50,
    })
    return jsonSuccess(c, { items })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

employeeRoutes.get('/leads/:id', ...employeeStack, requirePermission('leads.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getLeadDetailCrm(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})
