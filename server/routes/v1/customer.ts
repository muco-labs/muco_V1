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
  createInvoicePaymentIntent,
  createSupportTicket,
  decideProposal,
  getCustomerDashboard,
  getCustomerFileDownloadUrl,
  getCustomerInvoice,
  getCustomerProfile,
  getCustomerProjectDetail,
  getCustomerProposal,
  viewCustomerProposal,
  getSupportTicket,
  listCustomerFiles,
  listCustomerInvoices,
  listCustomerMessages,
  listCustomerPayments,
  listCustomerProjects,
  listCustomerProposals,
  listNotifications,
  listSupportTickets,
  markNotificationRead,
  registerCustomerFileUpload,
  replySupportTicket,
  requireCustomerContext,
  sendCustomerMessage,
  updateCustomerProfile,
  verifyRazorpayPayment,
} from '../../services/customer.service.js'
import {
  createCustomerProjectRequest,
  getCustomerProjectRequest,
  getProjectIntakePrefill,
  listCustomerProjectRequests,
} from '../../services/project-intake.service.js'
import {
  formatZodIntakeErrors,
  projectIntakeSchema,
} from '../../lib/validation/project-intake.js'
import {
  createProposalPaymentIntent,
  getCustomerPaymentDetail,
} from '../../services/proposal-payment.service.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import {
  finalizeCustomerProjectFile,
  getCustomerProjectFileDownload,
  listCustomerProjectFiles,
  prepareCustomerProjectFileUpload,
} from '../../services/project-files.service.js'
import {
  closeCustomerConversation,
  createCustomerConversation,
  getCustomerConversation,
  listCustomerConversations,
  markCustomerConversationRead,
  sendCustomerConversationMessage,
} from '../../services/customer-conversation.service.js'

export const customerRoutes = new Hono()

const customerStack = [authenticate, requirePortal('customer')] as const

function paramId(c: { req: { param: (name: string) => string | undefined } }, name = 'id') {
  const value = c.req.param(name)
  if (!value) {
    throw new AppError('VALIDATION_ERROR', 'Missing resource id.', 400)
  }
  return value
}

customerRoutes.get('/dashboard', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const data = await getCustomerDashboard(ctx)
    const { getCustomerConversationSummary } = await import(
      '../../services/customer-conversation.service.js'
    )
    const messageSummary = await getCustomerConversationSummary(ctx)
    return jsonSuccess(c, {
      ...data,
      messagesUnreadCount: messageSummary.unreadCount,
      latestConversation: messageSummary.latestConversation,
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/profile', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, await getCustomerProfile(ctx))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const profileSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  companyName: z.string().max(200).optional(),
  phone: z.string().max(40).optional(),
  jobTitle: z.string().max(120).optional(),
  billingAddress: z.string().max(500).optional(),
})

customerRoutes.patch('/profile', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Please check your profile details.', 400)
    }
    const updated = await updateCustomerProfile(ctx, parsed.data)
    return jsonSuccess(c, updated)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/projects', ...customerStack, requirePermission('projects.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listCustomerProjects(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const projectFileUploadSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(120),
  fileSizeBytes: z.number().int().positive(),
  category: z.string().max(40).optional(),
})

customerRoutes.get(
  '/projects/:id/files',
  ...customerStack,
  requirePermission('files.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await listCustomerProjectFiles(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/projects/:id/files/upload',
  ...customerStack,
  requirePermission('files.upload'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const body = await c.req.json().catch(() => null)
      const parsed = projectFileUploadSchema.safeParse(body)
      if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid file metadata.', 400)
      const data = await prepareCustomerProjectFileUpload(ctx, auth, paramId(c), parsed.data)
      return jsonSuccess(c, data, 201)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/projects/:id/files/:fileId/finalize',
  ...customerStack,
  requirePermission('files.upload'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const file = await finalizeCustomerProjectFile(ctx, paramId(c), paramId(c, 'fileId'))
      return jsonSuccess(c, file)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.get(
  '/projects/:id/files/:fileId/download',
  ...customerStack,
  requirePermission('files.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(
        c,
        await getCustomerProjectFileDownload(ctx, paramId(c), paramId(c, 'fileId')),
      )
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.get(
  '/projects/:id',
  ...customerStack,
  requirePermission('projects.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const data = await getCustomerProjectDetail(ctx, paramId(c))
      return jsonSuccess(c, data)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.get('/proposals', ...customerStack, requirePermission('proposals.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listCustomerProposals(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get(
  '/proposals/:id',
  ...customerStack,
  requirePermission('proposals.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await getCustomerProposal(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

const proposalDecisionSchema = z.object({
  note: z.string().max(2000).optional(),
})

customerRoutes.post(
  '/proposals/:id/view',
  ...customerStack,
  requirePermission('proposals.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await viewCustomerProposal(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/proposals/:id/accept',
  ...customerStack,
  requirePermission('proposals.approve'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const body = await c.req.json().catch(() => ({}))
      const parsed = proposalDecisionSchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request.', 400)
      }
      const data = await decideProposal(ctx, paramId(c), 'approve', parsed.data.note)
      return jsonSuccess(c, data)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/proposals/:id/approve',
  ...customerStack,
  requirePermission('proposals.approve'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const body = await c.req.json().catch(() => ({}))
      const parsed = proposalDecisionSchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request.', 400)
      }
      const data = await decideProposal(ctx, paramId(c), 'approve', parsed.data.note)
      return jsonSuccess(c, data)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/proposals/:id/request-changes',
  ...customerStack,
  requirePermission('proposals.approve'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const body = await c.req.json().catch(() => ({}))
      const parsed = proposalDecisionSchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request.', 400)
      }
      const data = await decideProposal(
        ctx,
        paramId(c),
        'request_changes',
        parsed.data.note,
      )
      return jsonSuccess(c, data)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/proposals/:id/reject',
  ...customerStack,
  requirePermission('proposals.approve'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const body = await c.req.json().catch(() => ({}))
      const parsed = proposalDecisionSchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid request.', 400)
      }
      const data = await decideProposal(ctx, paramId(c), 'reject', parsed.data.note)
      return jsonSuccess(c, data)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.get('/invoices', ...customerStack, requirePermission('invoices.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listCustomerInvoices(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get(
  '/invoices/:id',
  ...customerStack,
  requirePermission('invoices.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await getCustomerInvoice(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/invoices/:id/pay',
  ...customerStack,
  requirePermission('payments.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const data = await createInvoicePaymentIntent(ctx, paramId(c))
      return jsonSuccess(c, data)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/proposals/:id/payment',
  ...customerStack,
  requirePermission('payments.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await createProposalPaymentIntent(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

const verifyPaymentSchema = z.object({
  paymentId: z.string().uuid(),
  razorpayOrderId: z.string().min(4),
  razorpayPaymentId: z.string().min(4),
  razorpaySignature: z.string().min(8),
})

customerRoutes.post('/payments/verify', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = verifyPaymentSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid payment verification payload.', 400)
    }
    const data = await verifyRazorpayPayment(ctx, parsed.data)
    return jsonSuccess(c, data)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.post(
  '/payments/:id/verify',
  ...customerStack,
  requirePermission('payments.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const body = await c.req.json().catch(() => null)
      const parsed = verifyPaymentSchema.safeParse({
        ...(body && typeof body === 'object' ? body : {}),
        paymentId: paramId(c),
      })
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid payment verification payload.', 400)
      }
      const data = await verifyRazorpayPayment(ctx, parsed.data)
      return jsonSuccess(c, data)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.get('/payments', ...customerStack, requirePermission('payments.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listCustomerPayments(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get(
  '/payments/:id',
  ...customerStack,
  requirePermission('payments.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await getCustomerPaymentDetail(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.get('/files', ...customerStack, requirePermission('files.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const projectId = c.req.query('projectId')
    return jsonSuccess(c, { items: await listCustomerFiles(ctx, projectId) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const uploadMetaSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(120),
  fileSizeBytes: z.number().int().positive(),
  projectId: z.string().uuid().optional(),
  category: z.string().max(40).optional(),
})

customerRoutes.post('/files', ...customerStack, requirePermission('files.upload'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = uploadMetaSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid file metadata.', 400)
    }
    const data = await registerCustomerFileUpload(ctx, auth, parsed.data)
    return jsonSuccess(c, data, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/files/:id/download', ...customerStack, requirePermission('files.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, await getCustomerFileDownloadUrl(ctx, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/messages', ...customerStack, requirePermission('messages.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const projectId = c.req.query('projectId')
    return jsonSuccess(c, { items: await listCustomerMessages(ctx, projectId) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const messageSchema = z.object({
  body: z.string().min(2).max(8000),
  projectId: z.string().uuid().optional(),
})

customerRoutes.post('/messages', ...customerStack, requirePermission('messages.send'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = messageSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid message.', 400)
    }
    const row = await sendCustomerMessage(ctx, parsed.data)
    return jsonSuccess(c, row, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/support', ...customerStack, requirePermission('support.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listSupportTickets(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/support/:id', ...customerStack, requirePermission('support.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, await getSupportTicket(ctx, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const ticketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10).max(8000),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  projectId: z.string().uuid().optional(),
})

customerRoutes.post('/support', ...customerStack, requirePermission('support.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = ticketSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid support ticket.', 400)
    }
    const ticket = await createSupportTicket(ctx, parsed.data)
    return jsonSuccess(c, ticket, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const replySchema = z.object({ body: z.string().min(2).max(8000) })

customerRoutes.post(
  '/support/:id/replies',
  ...customerStack,
  requirePermission('support.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const body = await c.req.json().catch(() => null)
      const parsed = replySchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid reply.', 400)
      }
      const reply = await replySupportTicket(ctx, paramId(c), parsed.data.body)
      return jsonSuccess(c, reply, 201)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.get('/notifications', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listNotifications(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.patch('/notifications/:id/read', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const row = await markNotificationRead(ctx, paramId(c))
    return jsonSuccess(c, row)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/project-requests/prefill', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, await getProjectIntakePrefill(ctx))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/project-requests', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listCustomerProjectRequests(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/project-requests/:id', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, await getCustomerProjectRequest(ctx, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.post('/project-requests', ...customerStack, async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = projectIntakeSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Please check your project details.',
        400,
        formatZodIntakeErrors(parsed.error),
      )
    }
    const result = await createCustomerProjectRequest(ctx, parsed.data)
    return jsonSuccess(c, result, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const conversationCreateSchema = z
  .object({
    subject: z.string().min(3).max(200).optional(),
    body: z.string().max(8000).optional(),
    projectId: z.string().uuid().optional(),
    leadId: z.string().uuid().optional(),
    proposalId: z.string().uuid().optional(),
  })
  .refine(
    (value) => !(value.projectId && value.leadId) && !(value.projectId && value.proposalId) && !(value.leadId && value.proposalId),
    { message: 'Provide only one context id.' },
  )

customerRoutes.get('/conversations', ...customerStack, requirePermission('messages.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, { items: await listCustomerConversations(ctx) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.get('/conversations/:id', ...customerStack, requirePermission('messages.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    return jsonSuccess(c, await getCustomerConversation(ctx, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

customerRoutes.post('/conversations', ...customerStack, requirePermission('messages.send'), async (c) => {
  try {
    const auth = c.get('auth')
    const ctx = await requireCustomerContext(auth)
    const body = await c.req.json().catch(() => null)
    const parsed = conversationCreateSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid conversation.', 400)
    }
    const row = await createCustomerConversation(ctx, parsed.data)
    return jsonSuccess(c, row, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const conversationMessageSchema = z.object({ body: z.string().min(1).max(8000) })

customerRoutes.post(
  '/conversations/:id/messages',
  ...customerStack,
  requirePermission('messages.send'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      const limit = checkRateLimit(
        rateLimitKeyFromRequest(
          c.req.header('x-forwarded-for') ?? c.req.header('cf-connecting-ip'),
          `customer:conversation-message:${ctx.userId}`,
        ),
        { max: 40, windowMs: 60_000 },
      )
      if (!limit.allowed) {
        throw new AppError('RATE_LIMITED', 'Too many messages. Please wait a moment.', 429)
      }
      const body = await c.req.json().catch(() => null)
      const parsed = conversationMessageSchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid message.', 400)
      }
      const row = await sendCustomerConversationMessage(ctx, paramId(c), parsed.data.body)
      return jsonSuccess(c, row, 201)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/conversations/:id/read',
  ...customerStack,
  requirePermission('messages.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await markCustomerConversationRead(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

customerRoutes.post(
  '/conversations/:id/close',
  ...customerStack,
  requirePermission('messages.send'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const ctx = await requireCustomerContext(auth)
      return jsonSuccess(c, await closeCustomerConversation(ctx, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)
