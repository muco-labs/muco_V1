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
  formatZodErrors,
  inviteEmployeeSchema,
  updateUserStatusSchema,
} from '../../lib/validation/auth.js'
import { inviteEmployee, setUserStatus } from '../../services/auth.service.js'
import { checkRateLimit, rateLimitKeyFromRequest } from '../../middleware/rate-limit.js'
import { serverEnv } from '../../lib/env.js'
import { bootstrapFounderAccount } from '../../services/auth.service.js'
import {
  adminSearch,
  assertCanChangeUserStatus,
  approveProposalForSend,
  createInvoiceAdmin,
  createInvoiceWithLineItemsAdmin,
  createLeadAdmin,
  createProjectAdmin,
  createProposalAdmin,
  createTaskAdmin,
  getAdminAnalytics,
  getAdminDashboard,
  getCustomerAdmin,
  getIntegrationStatus,
  issueInvoiceAdmin,
  listAuditLogsAdmin,
  listAutomationAuditLogs,
  listFilesAdmin,
  listMessagesAdmin,
  listCustomersAdmin,
  listEmployeesAdmin,
  listInvoicesAdmin,
  listPaymentsAdmin,
  listSupportAdmin,
  listTasksAdmin,
  requireFinancialPermission,
  setProposalDiscount,
  updateSupportAdmin,
  updateTaskAdmin,
} from '../../services/admin.service.js'
import {
  addProjectMemberAdmin,
  listProjectMemberCandidatesAdmin,
  listProjectMembersDetailedAdmin,
  removeProjectMemberAdmin,
  updateProjectMemberRoleAdmin,
} from '../../services/project-team.service.js'
import {
  getAdminConversation,
  listAdminConversations,
  markAdminConversationRead,
  sendAdminConversationMessage,
  setAdminConversationStatus,
} from '../../services/customer-conversation.service.js'
import {
  cancelProjectTaskAdmin,
  completeProjectTaskAdmin,
  createProjectTaskAdmin,
  getProjectTaskAdmin,
  listProjectTasksAdmin,
  updateProjectTaskAdmin,
} from '../../services/project-tasks.service.js'
import {
  finalizeAdminProjectFile,
  getAdminProjectFileDownload,
  listAdminProjectFiles,
  prepareAdminProjectFileUpload,
  updateAdminProjectFile,
} from '../../services/project-files.service.js'
import {
  addLeadNoteCrm,
  assignLeadCrm,
  convertLeadCrm,
  getCrmMetrics,
  getCrmPipeline,
  getLeadActivityCrm,
  getLeadDetailCrm,
  listLeadsForCrm,
  logLeadInteractionCrm,
  scheduleLeadFollowUpCrm,
  updateLeadCrm,
} from '../../services/crm.service.js'
import {
  applyProjectTemplate,
  completeProjectWorkflow,
  createProjectFromProposal,
  getOperationsReport,
  getProjectBusinessTimeline,
} from '../../services/workflow.service.js'
import { PROJECT_TEMPLATE_IDS } from '../../lib/workflow/project-templates.js'
import {
  getMonthlyManagementReport,
  getRevenueDashboard,
  getSalesDashboard,
} from '../../services/sales.service.js'
import { normalizeLeadSource } from '../../lib/crm/constants.js'
import { getErodeMarketDashboard } from '../../services/local.service.js'
import { getNationalMarketDashboard } from '../../services/market.service.js'
import { getInternationalMarketDashboard } from '../../services/international.service.js'
import { listProductWaitlistForAdmin } from '../../services/product-waitlist.service.js'
import { websiteIntelligenceRoutes } from './website-intelligence.js'
import {
  addCareerApplicationNoteAdmin,
  createCareerJobOpeningAdmin,
  getCareerApplicationAdmin,
  getCareerJobOpeningAdmin,
  getCareerResumeDownloadUrlAdmin,
  listCareerApplicationsAdmin,
  listCareerJobOpeningsAdmin,
  updateCareerApplicationStatusAdmin,
  updateCareerJobOpeningAdmin,
  updateCareerJobOpeningStatusAdmin,
} from '../../services/careers.service.js'
import {
  createCareerJobOpeningSchema,
  updateCareerApplicationStatusSchema,
  updateCareerJobOpeningSchema,
  updateCareerJobStatusSchema,
} from '../../lib/validation/careers.js'
import {
  addFreelancerInternalNote,
  getFreelancerAdmin,
  listFreelancersAdmin,
  listFreelancerInternalNotesAdmin,
  patchFreelancerAdmin,
} from '../../services/freelancer-network.service.js'
import {
  freelancerAdminPatchSchema,
  freelancerNoteSchema,
} from '../../lib/validation/freelancers.js'
import {
  createProjectFromLeadCrm,
  getProjectFulfillmentAdmin,
  listProjectsFulfillmentAdmin,
  updateProjectFulfillmentAdmin,
} from '../../services/project-fulfillment.service.js'
import {
  createProjectMilestoneAdmin,
  reorderProjectMilestoneAdmin,
  startProjectDeliveryAdmin,
  updateProjectMilestoneAdmin,
} from '../../services/project-delivery.service.js'
import { PROJECT_FULFILLMENT_STATUSES } from '../../lib/projects/project-fulfillment.js'
import {
  cancelProposalAdmin,
  createProposalFromLeadCrm,
  createProposalFromProjectCrm,
  getProposalFulfillmentAdmin,
  listProposalsFulfillmentAdmin,
  sendProposalFulfillmentAdmin,
  updateProposalDraftAdmin,
} from '../../services/proposal-fulfillment.service.js'
import { getPaymentFulfillmentAdmin } from '../../services/proposal-payment.service.js'
import {
  getEmployeeAccessReview,
  getExecutiveOverview,
  syncEmploymentStateForUserStatus,
  updateEmployeeOrg,
} from '../../services/org.service.js'
import {
  formatZodErrors as formatEmployeeOrgErrors,
  updateEmployeeOrgSchema,
} from '../../lib/validation/employee-org.js'

export const adminRoutes = new Hono()

const bootstrapSchema = z.object({
  email: z.string().trim().email(),
  fullName: z.string().trim().min(1).max(120),
  bootstrapSecret: z.string().min(8),
})

adminRoutes.post('/bootstrap/founder', async (c) => {
  try {
    const limit = checkRateLimit(
      rateLimitKeyFromRequest(
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip'),
        'POST /api/v1/admin/bootstrap/founder',
      ),
      { max: 5, windowMs: 60 * 60 * 1000 },
    )
    if (!limit.allowed) {
      throw new AppError('RATE_LIMITED', 'Too many attempts. Try again later.', 429)
    }

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

adminRoutes.use('*', authenticate)
adminRoutes.use('*', requirePortal('admin'))
adminRoutes.route('/website-intelligence', websiteIntelligenceRoutes)

function paramId(c: { req: { param: (name: string) => string | undefined } }, name = 'id') {
  const value = c.req.param(name)
  if (!value) throw new AppError('VALIDATION_ERROR', 'Missing resource id.', 400)
  return value
}

adminRoutes.get('/dashboard', async (c) => {
  try {
    return jsonSuccess(c, await getAdminDashboard())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/analytics', requirePermission('analytics.view'), async (c) => {
  try {
    return jsonSuccess(c, await getAdminAnalytics())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/integrations', async (c) => {
  try {
    return jsonSuccess(c, getIntegrationStatus())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/search', async (c) => {
  try {
    const q = c.req.query('q') ?? ''
    return jsonSuccess(c, await adminSearch(q))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/audit-logs', requirePermission('audit_logs.view'), async (c) => {
  try {
    return jsonSuccess(c, { items: await listAuditLogsAdmin() })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/audit-logs/automation', requirePermission('audit_logs.view'), async (c) => {
  try {
    return jsonSuccess(c, { items: await listAutomationAuditLogs() })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/workflow/templates', requirePermission('projects.view'), async (c) => {
  try {
    return jsonSuccess(c, { templates: PROJECT_TEMPLATE_IDS })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/operations/report', requirePermission('analytics.view'), async (c) => {
  try {
    return jsonSuccess(c, await getOperationsReport())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/sales/dashboard', requirePermission('leads.view'), async (c) => {
  try {
    return jsonSuccess(c, await getSalesDashboard(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/sales/revenue', requirePermission('invoices.view'), async (c) => {
  try {
    requireFinancialPermission(c.get('auth'))
    return jsonSuccess(c, await getRevenueDashboard())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/sales/monthly-report', requirePermission('analytics.view'), async (c) => {
  try {
    requireFinancialPermission(c.get('auth'))
    return jsonSuccess(c, await getMonthlyManagementReport(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/proposals/:id/create-project', requirePermission('projects.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => ({}))
    const parsed = z
      .object({ name: z.string().optional(), operationalPhase: z.string().optional() })
      .safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid input.', 400)
    return jsonSuccess(
      c,
      await createProjectFromProposal(auth.userId, paramId(c), parsed.data),
      201,
    )
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/projects/:id/complete', requirePermission('projects.update'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await completeProjectWorkflow(auth.userId, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/projects/:id/apply-template', requirePermission('projects.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = z.object({ templateId: z.string().trim().min(1) }).safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid template.', 400)
    return jsonSuccess(
      c,
      await applyProjectTemplate(auth.userId, paramId(c), parsed.data.templateId),
      201,
    )
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/projects/:id/timeline', requirePermission('projects.view'), async (c) => {
  try {
    return jsonSuccess(c, await getProjectBusinessTimeline(paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/crm/metrics', requirePermission('leads.view'), async (c) => {
  try {
    return jsonSuccess(c, await getCrmMetrics(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/crm/pipeline', requirePermission('leads.view'), async (c) => {
  try {
    return jsonSuccess(c, await getCrmPipeline(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/local/erode-dashboard', requirePermission('leads.view'), async (c) => {
  try {
    return jsonSuccess(c, await getErodeMarketDashboard(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/local/india-dashboard', requirePermission('leads.view'), async (c) => {
  try {
    return jsonSuccess(c, await getNationalMarketDashboard(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/local/international-dashboard', requirePermission('leads.view'), async (c) => {
  try {
    return jsonSuccess(c, await getInternationalMarketDashboard(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/product/waitlist', requirePermission('settings.manage'), async (c) => {
  try {
    const productSlug = c.req.query('productSlug')
    const items = await listProductWaitlistForAdmin({
      productSlug: productSlug || undefined,
    })
    return jsonSuccess(c, { items, count: items.length })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const careerNoteSchema = z.object({
  content: z.string().trim().min(1).max(8000),
})

adminRoutes.get('/careers/jobs', requirePermission('careers.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const items = await listCareerJobOpeningsAdmin(auth, {
      status: c.req.query('status'),
      q: c.req.query('q'),
    })
    return jsonSuccess(c, { items, count: items.length })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/careers/jobs', requirePermission('careers.manage'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = createCareerJobOpeningSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid job opening.', 400, formatZodErrors(parsed.error))
    }
    const job = await createCareerJobOpeningAdmin(auth, parsed.data)
    return jsonSuccess(c, { job }, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/careers/jobs/:id', requirePermission('careers.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getCareerJobOpeningAdmin(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/careers/jobs/:id', requirePermission('careers.manage'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = updateCareerJobOpeningSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid job opening.', 400, formatZodErrors(parsed.error))
    }
    const job = await updateCareerJobOpeningAdmin(auth, paramId(c), parsed.data)
    return jsonSuccess(c, { job })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/careers/jobs/:id/status', requirePermission('careers.manage'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = updateCareerJobStatusSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid status.', 400, formatZodErrors(parsed.error))
    }
    const job = await updateCareerJobOpeningStatusAdmin(auth, paramId(c), parsed.data.status)
    return jsonSuccess(c, { job })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/careers/applications', requirePermission('careers.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const items = await listCareerApplicationsAdmin(auth, {
      status: c.req.query('status'),
      q: c.req.query('q'),
      jobOpeningId: c.req.query('jobOpeningId'),
      applicationType: c.req.query('applicationType'),
      from: c.req.query('from'),
      to: c.req.query('to'),
    })
    return jsonSuccess(c, { items, count: items.length })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/careers/applications/:id', requirePermission('careers.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getCareerApplicationAdmin(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/careers/applications/:id', requirePermission('careers.manage'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = updateCareerApplicationStatusSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid status.', 400, formatZodErrors(parsed.error))
    }
    const updated = await updateCareerApplicationStatusAdmin(
      auth,
      paramId(c),
      parsed.data.status,
    )
    return jsonSuccess(c, { application: updated })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/careers/applications/:id/notes', requirePermission('careers.notes'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = careerNoteSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid note.', 400, formatZodErrors(parsed.error))
    }
    const note = await addCareerApplicationNoteAdmin(auth, paramId(c), parsed.data.content)
    return jsonSuccess(c, { note }, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get(
  '/careers/applications/:id/resume',
  requirePermission('careers.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      return jsonSuccess(c, await getCareerResumeDownloadUrlAdmin(auth, paramId(c)))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

adminRoutes.get('/freelancers', requirePermission('freelancers.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, {
      items: await listFreelancersAdmin(auth, {
        q: c.req.query('q'),
        approvalStatus: c.req.query('approvalStatus'),
        verificationStatus: c.req.query('verificationStatus'),
        availabilityStatus: c.req.query('availabilityStatus'),
        serviceCategory: c.req.query('serviceCategory'),
        professionalRole: c.req.query('professionalRole'),
      }),
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/freelancers/:id', requirePermission('freelancers.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getFreelancerAdmin(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/freelancers/:id', requirePermission('freelancers.manage'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerAdminPatchSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid update.', 400)
    return jsonSuccess(c, await patchFreelancerAdmin(auth, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/freelancers/:id/notes', requirePermission('freelancers.notes'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await listFreelancerInternalNotesAdmin(auth, paramId(c)) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/freelancers/:id/notes', requirePermission('freelancers.notes'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = freelancerNoteSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid note.', 400)
    return jsonSuccess(c, await addFreelancerInternalNote(auth, paramId(c), parsed.data.content), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/leads', requirePermission('leads.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const items = await listLeadsForCrm(auth, {
      status: c.req.query('status'),
      channel: c.req.query('channel') as 'start_project' | 'contact' | 'other' | undefined,
      priority: c.req.query('priority'),
      source: c.req.query('source'),
      assignedEmployeeId: c.req.query('assignedEmployeeId'),
      q: c.req.query('q'),
      locality: c.req.query('locality') as
        | 'erode'
        | 'tamil_nadu'
        | 'india'
        | 'international'
        | undefined,
      market: c.req.query('market') as 'us' | 'uk' | 'ca' | 'au' | 'ae' | 'sg' | undefined,
      followUp: c.req.query('followUp') as 'overdue' | 'today' | 'upcoming' | 'none' | undefined,
      sort: (c.req.query('sort') as 'newest') ?? 'newest',
      limit: Number(c.req.query('limit') || 50),
      offset: Number(c.req.query('offset') || 0),
    })
    return jsonSuccess(c, { items })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/leads/:id/activity', requirePermission('leads.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await getLeadActivityCrm(auth, paramId(c)) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/leads/:id/assign', requirePermission('leads.assign'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const employeeId = z.object({ employeeId: z.string().uuid() }).safeParse(body)
    if (!employeeId.success) throw new AppError('VALIDATION_ERROR', 'Invalid assignment.', 400)
    return jsonSuccess(c, await assignLeadCrm(auth, paramId(c), employeeId.data.employeeId))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/leads/:id/notes', requirePermission('leads.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = z.object({ content: z.string().min(1).max(8000) }).safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid note.', 400)
    return jsonSuccess(c, await addLeadNoteCrm(auth, paramId(c), parsed.data.content), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/leads/:id/follow-up', requirePermission('leads.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = z
      .object({
        followUpAt: z.string(),
        followUpStatus: z.string().optional(),
      })
      .safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid follow-up.', 400)
    return jsonSuccess(c, await scheduleLeadFollowUpCrm(auth, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/leads/:id/interactions', requirePermission('leads.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = z
      .object({
        interactionType: z.string().min(1).max(32),
        summary: z.string().min(1).max(4000),
        occurredAt: z.string().optional(),
        nextAction: z.string().max(500).optional(),
      })
      .safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid interaction.', 400)
    return jsonSuccess(c, await logLeadInteractionCrm(auth, paramId(c), parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/leads/:id/convert', requirePermission('customers.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = z
      .object({
        linkExistingCustomerId: z.string().uuid().optional(),
        invite: z.boolean().optional(),
      })
      .safeParse(body ?? {})
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid conversion.', 400)
    return jsonSuccess(c, await convertLeadCrm(auth, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/leads/:id', requirePermission('leads.view'), async (c) => {
  try {
    return jsonSuccess(c, await getLeadDetailCrm(c.get('auth'), paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const leadCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  serviceInterest: z.string().optional(),
  projectDescription: z.string().min(10),
  source: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  notes: z.string().optional(),
})

adminRoutes.post('/leads', requirePermission('leads.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = leadCreateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid lead.', 400)
    const row = await createLeadAdmin(auth.userId, parsed.data)
    return jsonSuccess(c, row, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const leadUpdateSchema = z.object({
  status: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  notes: z.string().optional(),
  assignedEmployeeId: z.string().uuid().nullable().optional(),
  followUpAt: z.string().nullable().optional(),
  followUpStatus: z.string().optional(),
  lostReason: z.string().optional(),
  serviceInterest: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  qualificationBusinessType: z.string().optional(),
  qualificationProjectSize: z.string().optional(),
  qualificationUrgency: z.string().optional(),
  qualificationDecisionMaker: z.string().optional(),
  source: z.string().optional(),
  salesNextAction: z.string().max(500).optional(),
})

adminRoutes.patch('/leads/:id', requirePermission('leads.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = leadUpdateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid update.', 400)
    return jsonSuccess(c, await updateLeadCrm(auth, paramId(c), {
      ...parsed.data,
      source: parsed.data.source ? normalizeLeadSource(parsed.data.source) : undefined,
    }))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/customers', requirePermission('customers.view'), async (c) => {
  try {
    return jsonSuccess(c, { items: await listCustomersAdmin(c.req.query('q')) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/customers/:id', requirePermission('customers.view'), async (c) => {
  try {
    return jsonSuccess(c, await getCustomerAdmin(paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/employees', requirePermission('employees.view'), async (c) => {
  try {
    return jsonSuccess(c, { items: await listEmployeesAdmin() })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/employees/access-review', requirePermission('employees.view'), async (c) => {
  try {
    return jsonSuccess(c, await getEmployeeAccessReview())
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/employees/:employeeId/org', requirePermission('employees.update'), async (c) => {
  try {
    const employeeId = paramId(c, 'employeeId')
    const body = await c.req.json().catch(() => null)
    const parsed = updateEmployeeOrgSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError(
        'VALIDATION_ERROR',
        'Invalid employee organization fields.',
        400,
        formatEmployeeOrgErrors(parsed.error),
      )
    }
    const auth = c.get('auth')
    const updated = await updateEmployeeOrg(auth, employeeId, parsed.data)
    return jsonSuccess(c, updated)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/executive/overview', requirePermission('analytics.view'), async (c) => {
  try {
    return jsonSuccess(c, await getExecutiveOverview(c.get('auth')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

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
      throw new AppError('VALIDATION_ERROR', 'Please check the form.', 400, formatZodErrors(parsed.error))
    }
    const auth = c.get('auth')
    const result = await inviteEmployee({ ...parsed.data, invitedByUserId: auth.userId })
    return jsonSuccess(c, result, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/users/:userId/status', requirePermission('users.disable'), async (c) => {
  try {
    const userId = paramId(c, 'userId')
    const body = await c.req.json().catch(() => null)
    const parsed = updateUserStatusSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid status.', 400, formatZodErrors(parsed.error))
    }
    const auth = c.get('auth')
    if (auth.userId === userId && parsed.data.status !== 'active') {
      throw new AppError('FORBIDDEN', 'You cannot deactivate your own account.', 403)
    }
    await assertCanChangeUserStatus(auth, userId)
    await setUserStatus(userId, parsed.data.status, auth.userId)
    await syncEmploymentStateForUserStatus(userId, parsed.data.status, auth.userId)
    return jsonSuccess(c, { userId, status: parsed.data.status })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/projects', requirePermission('projects.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const items = await listProjectsFulfillmentAdmin(auth, {
      status: c.req.query('status'),
      q: c.req.query('q'),
    })
    return jsonSuccess(c, { items, count: items.length })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/projects/:id', requirePermission('projects.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getProjectFulfillmentAdmin(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const projectTaskCreateSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(8000).optional(),
  milestoneId: z.string().uuid().optional(),
  assignedEmployeeId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),
})

const projectTaskUpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(8000).nullable().optional(),
  milestoneId: z.string().uuid().nullable().optional(),
  assignedEmployeeId: z.string().uuid().nullable().optional(),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().nullable().optional(),
})

adminRoutes.get('/projects/:id/tasks', requirePermission('tasks.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const overdueOnly = c.req.query('overdueOnly') === 'true'
    return jsonSuccess(c, {
      items: await listProjectTasksAdmin(auth, paramId(c), {
        status: c.req.query('status'),
        priority: c.req.query('priority'),
        milestoneId: c.req.query('milestoneId'),
        assigneeEmployeeId: c.req.query('assigneeEmployeeId'),
        overdueOnly,
      }),
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/projects/:id/tasks', requirePermission('tasks.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = projectTaskCreateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid task.', 400)
    return jsonSuccess(c, await createProjectTaskAdmin(auth, paramId(c), parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/projects/:id/tasks/:taskId', requirePermission('tasks.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getProjectTaskAdmin(auth, paramId(c), paramId(c, 'taskId')))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/projects/:id/tasks/:taskId', requirePermission('tasks.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = projectTaskUpdateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid task update.', 400)
    return jsonSuccess(
      c,
      await updateProjectTaskAdmin(auth, paramId(c), paramId(c, 'taskId'), parsed.data),
    )
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post(
  '/projects/:id/tasks/:taskId/complete',
  requirePermission('tasks.update'),
  async (c) => {
    try {
      const auth = c.get('auth')
      return jsonSuccess(c, await completeProjectTaskAdmin(auth, paramId(c), paramId(c, 'taskId')))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

adminRoutes.post(
  '/projects/:id/tasks/:taskId/cancel',
  requirePermission('tasks.update'),
  async (c) => {
    try {
      const auth = c.get('auth')
      return jsonSuccess(c, await cancelProjectTaskAdmin(auth, paramId(c), paramId(c, 'taskId')))
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

const adminProjectFileUploadSchema = z.object({
  fileName: z.string().min(1).max(200),
  mimeType: z.string().min(3).max(120),
  fileSizeBytes: z.number().int().positive(),
  category: z.string().max(40).optional(),
  visibility: z.enum(['internal', 'customer_visible']).optional(),
})

const adminProjectFilePatchSchema = z.object({
  visibility: z.enum(['internal', 'customer_visible']).optional(),
  category: z.string().max(40).optional(),
  status: z.enum(['active', 'archived']).optional(),
})

adminRoutes.get('/projects/:id/files', requirePermission('files.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await listAdminProjectFiles(auth, paramId(c)) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/projects/:id/files/upload', requirePermission('files.upload'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = adminProjectFileUploadSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid file metadata.', 400)
    const data = await prepareAdminProjectFileUpload(auth, paramId(c), parsed.data)
    return jsonSuccess(c, data, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post(
  '/projects/:id/files/:fileId/finalize',
  requirePermission('files.upload'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const file = await finalizeAdminProjectFile(auth, paramId(c), paramId(c, 'fileId'))
      return jsonSuccess(c, file)
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

adminRoutes.patch(
  '/projects/:id/files/:fileId',
  requirePermission('files.delete'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const body = await c.req.json().catch(() => null)
      const parsed = adminProjectFilePatchSchema.safeParse(body)
      if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid update.', 400)
      return jsonSuccess(
        c,
        await updateAdminProjectFile(auth, paramId(c), paramId(c, 'fileId'), parsed.data),
      )
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

adminRoutes.get(
  '/projects/:id/files/:fileId/download',
  requirePermission('files.view'),
  async (c) => {
    try {
      const auth = c.get('auth')
      return jsonSuccess(
        c,
        await getAdminProjectFileDownload(auth, paramId(c), paramId(c, 'fileId')),
      )
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

const projectPatchSchema = z.object({
  status: z.enum(PROJECT_FULFILLMENT_STATUSES).optional(),
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(8000).optional(),
})

adminRoutes.patch('/projects/:id', requirePermission('projects.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = projectPatchSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid project update.', 400, formatZodErrors(parsed.error))
    }
    const project = await updateProjectFulfillmentAdmin(auth, paramId(c), parsed.data)
    return jsonSuccess(c, { project })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/projects/:id/start', requirePermission('projects.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const project = await startProjectDeliveryAdmin(auth, paramId(c))
    return jsonSuccess(c, {
      project: {
        id: project.id,
        status: project.status,
        startDate: project.startDate?.toISOString() ?? null,
      },
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const milestoneCreateSchema = z.object({
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional(),
  dueDate: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

adminRoutes.post('/projects/:id/milestones', requirePermission('projects.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = milestoneCreateSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid milestone.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(
      c,
      await createProjectMilestoneAdmin(auth, paramId(c), parsed.data),
      201,
    )
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const milestonePatchSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  dueDate: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
})

adminRoutes.patch('/milestones/:id', requirePermission('projects.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = milestonePatchSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid milestone update.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(c, await updateProjectMilestoneAdmin(auth, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const milestoneReorderSchema = z.object({
  direction: z.enum(['up', 'down']),
})

adminRoutes.post(
  '/projects/:id/milestones/:milestoneId/reorder',
  requirePermission('projects.update'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const body = await c.req.json().catch(() => null)
      const parsed = milestoneReorderSchema.safeParse(body)
      if (!parsed.success) {
        throw new AppError('VALIDATION_ERROR', 'Invalid reorder request.', 400, formatZodErrors(parsed.error))
      }
      const projectId = paramId(c)
      const milestoneId = c.req.param('milestoneId')
      if (!milestoneId) {
        throw new AppError('VALIDATION_ERROR', 'Milestone id is required.', 400)
      }
      return jsonSuccess(
        c,
        await reorderProjectMilestoneAdmin(auth, projectId, milestoneId, parsed.data.direction),
      )
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

adminRoutes.post('/leads/:id/create-project', requirePermission('projects.create'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await createProjectFromLeadCrm(auth, paramId(c)), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const projectCreateSchema = z.object({
  customerId: z.string().uuid(),
  name: z.string().min(2),
  description: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  expectedCompletion: z.string().optional(),
})

adminRoutes.post('/projects', requirePermission('projects.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = projectCreateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid project.', 400)
    return jsonSuccess(c, await createProjectAdmin(auth.userId, parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const assignSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.string().min(1).max(80),
})

const memberRoleSchema = z.object({
  role: z.string().min(1).max(80),
})

adminRoutes.get('/projects/:id/members', requirePermission('projects.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await listProjectMembersDetailedAdmin(auth, paramId(c)) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/projects/:id/member-candidates', requirePermission('projects.assign'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { items: await listProjectMemberCandidatesAdmin(auth, paramId(c)) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/projects/:id/members', requirePermission('projects.assign'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = assignSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid assignment.', 400)
    return jsonSuccess(
      c,
      await addProjectMemberAdmin(auth, paramId(c), parsed.data.employeeId, parsed.data.role),
      201,
    )
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch(
  '/projects/:id/members/:memberId',
  requirePermission('projects.assign'),
  async (c) => {
    try {
      const auth = c.get('auth')
      const body = await c.req.json().catch(() => null)
      const parsed = memberRoleSchema.safeParse(body)
      if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid role.', 400)
      return jsonSuccess(
        c,
        await updateProjectMemberRoleAdmin(
          auth,
          paramId(c),
          paramId(c, 'memberId'),
          parsed.data.role,
        ),
      )
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

adminRoutes.delete(
  '/projects/:id/members/:memberId',
  requirePermission('projects.assign'),
  async (c) => {
    try {
      const auth = c.get('auth')
      return jsonSuccess(
        c,
        await removeProjectMemberAdmin(auth, paramId(c), paramId(c, 'memberId')),
      )
    } catch (error) {
      return handleRouteError(c, error)
    }
  },
)

adminRoutes.get('/tasks', requirePermission('tasks.view'), async (c) => {
  try {
    return jsonSuccess(c, {
      items: await listTasksAdmin({ projectId: c.req.query('projectId') }),
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const taskCreateSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  assignedEmployeeId: z.string().uuid().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
})

adminRoutes.post('/tasks', requirePermission('tasks.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = taskCreateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid task.', 400)
    return jsonSuccess(c, await createTaskAdmin(auth.userId, parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const taskUpdateSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'blocked', 'done', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  assignedEmployeeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().nullable().optional(),
})

adminRoutes.patch('/tasks/:id', requirePermission('tasks.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = taskUpdateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid task update.', 400)
    return jsonSuccess(c, await updateTaskAdmin(auth.userId, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/proposals', requirePermission('proposals.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const items = await listProposalsFulfillmentAdmin(auth, {
      status: c.req.query('status'),
      q: c.req.query('q'),
    })
    return jsonSuccess(c, { items, count: items.length })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/proposals/:id', requirePermission('proposals.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getProposalFulfillmentAdmin(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const proposalLineItemSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.string().optional(),
  unitAmount: z.string(),
  itemType: z.string().optional(),
})

const proposalCreateSchema = z.object({
  customerId: z.string().uuid(),
  title: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().trim().max(8).optional(),
  scope: z.string().optional(),
  deliverables: z.string().optional(),
  timeline: z.string().optional(),
  terms: z.string().optional(),
  validUntil: z.string().optional(),
  paymentSchedule: z.string().optional(),
  projectId: z.string().uuid().optional(),
  leadId: z.string().uuid().optional(),
  lineItems: z.array(proposalLineItemSchema).optional(),
})

const proposalPatchSchema = z.object({
  title: z.string().trim().min(2).max(200).optional(),
  scope: z.string().trim().max(8000).optional(),
  deliverables: z.string().trim().max(8000).optional(),
  timeline: z.string().trim().max(4000).optional(),
  terms: z.string().trim().max(8000).optional(),
  validUntil: z.string().nullable().optional(),
  paymentSchedule: z.string().trim().max(2000).optional(),
  currency: z.string().trim().max(8).optional(),
  discountAmount: z.string().nullable().optional(),
  lineItems: z.array(proposalLineItemSchema).optional(),
})

adminRoutes.post('/proposals', requirePermission('proposals.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = proposalCreateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid proposal.', 400)
    return jsonSuccess(c, await createProposalAdmin(auth.userId, parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.patch('/proposals/:id', requirePermission('proposals.update'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = proposalPatchSchema.safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid proposal update.', 400, formatZodErrors(parsed.error))
    }
    return jsonSuccess(c, await updateProposalDraftAdmin(auth, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/proposals/:id/cancel', requirePermission('proposals.update'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { proposal: await cancelProposalAdmin(auth, paramId(c)) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/leads/:id/create-proposal', requirePermission('proposals.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => ({}))
    const parsed = proposalCreateSchema
      .pick({ title: true, scope: true, projectId: true, lineItems: true, validUntil: true })
      .safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid proposal.', 400)
    }
    return jsonSuccess(c, await createProposalFromLeadCrm(auth, paramId(c), parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/projects/:id/create-proposal', requirePermission('proposals.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => ({}))
    const parsed = proposalCreateSchema
      .pick({ title: true, scope: true, lineItems: true })
      .safeParse(body)
    if (!parsed.success) {
      throw new AppError('VALIDATION_ERROR', 'Invalid proposal.', 400)
    }
    return jsonSuccess(c, await createProposalFromProjectCrm(auth, paramId(c), parsed.data), 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/proposals/:id/send', requirePermission('proposals.send'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, { proposal: await sendProposalFulfillmentAdmin(auth, paramId(c)) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/proposals/:id/approve-send', requirePermission('proposals.create'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await approveProposalForSend(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/proposals/:id/discount', requirePermission('proposals.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = z
      .object({
        discountAmount: z.string(),
        discountNote: z.string().optional(),
      })
      .safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid discount.', 400)
    return jsonSuccess(c, await setProposalDiscount(auth, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/invoices', requirePermission('invoices.view'), async (c) => {
  try {
    requireFinancialPermission(c.get('auth'))
    return jsonSuccess(c, { items: await listInvoicesAdmin() })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const invoiceCreateSchema = z.object({
  customerId: z.string().uuid(),
  projectId: z.string().uuid().optional(),
  proposalId: z.string().uuid().optional(),
  invoiceNumber: z.string().min(2),
  amount: z.string().optional(),
  dueDate: z.string().optional(),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.string(),
        unitAmount: z.string(),
      }),
    )
    .optional(),
})

adminRoutes.post('/invoices', requirePermission('invoices.create'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = invoiceCreateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid invoice.', 400)
    if (parsed.data.lineItems?.length) {
      return jsonSuccess(
        c,
        await createInvoiceWithLineItemsAdmin(auth.userId, {
          customerId: parsed.data.customerId,
          projectId: parsed.data.projectId,
          proposalId: parsed.data.proposalId,
          invoiceNumber: parsed.data.invoiceNumber,
          dueDate: parsed.data.dueDate,
          lineItems: parsed.data.lineItems,
        }),
        201,
      )
    }
    if (!parsed.data.amount) {
      throw new AppError('VALIDATION_ERROR', 'Amount or line items required.', 400)
    }
    return jsonSuccess(
      c,
      await createInvoiceAdmin(auth.userId, {
        customerId: parsed.data.customerId,
        projectId: parsed.data.projectId,
        invoiceNumber: parsed.data.invoiceNumber,
        amount: parsed.data.amount,
        dueDate: parsed.data.dueDate,
      }),
      201,
    )
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/invoices/:id/issue', requirePermission('invoices.update'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await issueInvoiceAdmin(auth.userId, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/payments', requirePermission('payments.view'), async (c) => {
  try {
    requireFinancialPermission(c.get('auth'))
    return jsonSuccess(c, { items: await listPaymentsAdmin() })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/payments/:id', requirePermission('payments.view'), async (c) => {
  try {
    const auth = c.get('auth')
    requireFinancialPermission(auth)
    return jsonSuccess(c, await getPaymentFulfillmentAdmin(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/support', requirePermission('support.manage'), async (c) => {
  try {
    return jsonSuccess(c, { items: await listSupportAdmin() })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const supportUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
})

adminRoutes.patch('/support/:id', requirePermission('support.manage'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = supportUpdateSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid update.', 400)
    return jsonSuccess(c, await updateSupportAdmin(auth.userId, paramId(c), parsed.data))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/files', requirePermission('files.view'), async (c) => {
  try {
    return jsonSuccess(c, { items: await listFilesAdmin(c.req.query('projectId')) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/messages', requirePermission('messages.view'), async (c) => {
  try {
    return jsonSuccess(c, { items: await listMessagesAdmin(c.req.query('projectId')) })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/conversations', requirePermission('messages.view'), async (c) => {
  try {
    const auth = c.get('auth')
    const status = c.req.query('status')
    const unreadOnly = c.req.query('unreadOnly') === 'true'
    return jsonSuccess(c, {
      items: await listAdminConversations(auth, {
        status: status === 'open' || status === 'closed' ? status : undefined,
        unreadOnly,
      }),
    })
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.get('/conversations/:id', requirePermission('messages.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await getAdminConversation(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const adminConversationMessageSchema = z.object({ body: z.string().min(1).max(8000) })

adminRoutes.post('/conversations/:id/messages', requirePermission('messages.send'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => null)
    const parsed = adminConversationMessageSchema.safeParse(body)
    if (!parsed.success) throw new AppError('VALIDATION_ERROR', 'Invalid message.', 400)
    const row = await sendAdminConversationMessage(auth, paramId(c), parsed.data.body)
    return jsonSuccess(c, row, 201)
  } catch (error) {
    return handleRouteError(c, error)
  }
})

adminRoutes.post('/conversations/:id/read', requirePermission('messages.view'), async (c) => {
  try {
    const auth = c.get('auth')
    return jsonSuccess(c, await markAdminConversationRead(auth, paramId(c)))
  } catch (error) {
    return handleRouteError(c, error)
  }
})

const conversationStatusSchema = z.object({ status: z.enum(['open', 'closed']) })

adminRoutes.post('/conversations/:id/close', requirePermission('messages.send'), async (c) => {
  try {
    const auth = c.get('auth')
    const body = await c.req.json().catch(() => ({}))
    const parsed = conversationStatusSchema.safeParse(body)
    const status = parsed.success ? parsed.data.status : 'closed'
    return jsonSuccess(c, await setAdminConversationStatus(auth, paramId(c), status))
  } catch (error) {
    return handleRouteError(c, error)
  }
})
