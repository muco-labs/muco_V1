import { apiRequest } from '@/services/api'

const base = '/api/v1/admin'

export type AdminDashboard = {
  leadsNew: number
  qualifiedLeads: number
  activeProjects: number
  planningProjects?: number
  onHoldProjects?: number
  customers: number
  employees: number
  openSupportTickets: number
  outstandingInvoicesTotal: string
  revenueSucceeded: string
  pendingProposals: number
  openTasks: number
  tasksDueSoon: number
  overdueInvoices: number
  recentActivity: Array<Record<string, unknown>>
}

export type AdminConversationListItem = {
  id: string
  subject: string
  status: string
  contextLabel: string
  contextReference: string | null
  projectId: string | null
  leadId: string | null
  proposalId: string | null
  customer: { id: string; name: string; email: string }
  createdAt: string
  updatedAt: string
  unreadCount: number
  latestMessage?: { body: string; createdAt: string; senderType: string } | null
}

export type AdminConversationMessage = {
  id: string
  body: string
  senderType: 'customer' | 'team'
  customerVisible: boolean
  createdAt: string
  read: boolean
}

export const adminApi = {
  dashboard: () => apiRequest<AdminDashboard>(`${base}/dashboard`),
  crm: {
    metrics: () => apiRequest<Record<string, unknown>>(`${base}/crm/metrics`),
    pipeline: () => apiRequest<Record<string, unknown>>(`${base}/crm/pipeline`),
  },
  local: {
    erodeDashboard: () => apiRequest<Record<string, unknown>>(`${base}/local/erode-dashboard`),
    indiaDashboard: () => apiRequest<Record<string, unknown>>(`${base}/local/india-dashboard`),
    internationalDashboard: () =>
      apiRequest<Record<string, unknown>>(`${base}/local/international-dashboard`),
  },
  operations: {
    report: () => apiRequest<Record<string, unknown>>(`${base}/operations/report`),
  },
  sales: {
    dashboard: () => apiRequest<Record<string, unknown>>(`${base}/sales/dashboard`),
    revenue: () => apiRequest<Record<string, unknown>>(`${base}/sales/revenue`),
    monthlyReport: () => apiRequest<Record<string, unknown>>(`${base}/sales/monthly-report`),
  },
  analytics: () => apiRequest<Record<string, unknown>>(`${base}/analytics`),
  integrations: () => apiRequest<Record<string, unknown>>(`${base}/integrations`),
  product: {
    waitlist: (productSlug?: string) =>
      apiRequest<{ items: unknown[]; count: number }>(
        `${base}/product/waitlist${productSlug ? `?productSlug=${encodeURIComponent(productSlug)}` : ''}`,
      ),
  },
  careers: {
    listJobs: (params?: { status?: string; q?: string }) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.q) search.set('q', params.q)
      const qs = search.toString()
      return apiRequest<{ items: unknown[]; count: number }>(
        `${base}/careers/jobs${qs ? `?${qs}` : ''}`,
      )
    },
    getJob: (id: string) => apiRequest<Record<string, unknown>>(`${base}/careers/jobs/${id}`),
    createJob: (body: Record<string, unknown>) =>
      apiRequest(`${base}/careers/jobs`, { method: 'POST', json: body }),
    updateJob: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/careers/jobs/${id}`, { method: 'PATCH', json: body }),
    updateJobStatus: (id: string, status: string) =>
      apiRequest(`${base}/careers/jobs/${id}/status`, { method: 'PATCH', json: { status } }),
    listApplications: (params?: {
      status?: string
      q?: string
      jobOpeningId?: string
      applicationType?: string
      from?: string
      to?: string
    }) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.q) search.set('q', params.q)
      if (params?.jobOpeningId) search.set('jobOpeningId', params.jobOpeningId)
      if (params?.applicationType) search.set('applicationType', params.applicationType)
      if (params?.from) search.set('from', params.from)
      if (params?.to) search.set('to', params.to)
      const qs = search.toString()
      return apiRequest<{ items: unknown[]; count: number }>(
        `${base}/careers/applications${qs ? `?${qs}` : ''}`,
      )
    },
    getApplication: (id: string) =>
      apiRequest<Record<string, unknown>>(`${base}/careers/applications/${id}`),
    updateApplicationStatus: (id: string, status: string) =>
      apiRequest(`${base}/careers/applications/${id}`, { method: 'PATCH', json: { status } }),
    addApplicationNote: (id: string, content: string) =>
      apiRequest(`${base}/careers/applications/${id}/notes`, {
        method: 'POST',
        json: { content },
      }),
    resumeDownloadUrl: (id: string) =>
      apiRequest<{ url: string; fileName?: string }>(`${base}/careers/applications/${id}/resume`),
  },
  executive: {
    overview: () => apiRequest<Record<string, unknown>>(`${base}/executive/overview`),
  },
  websiteIntelligence: {
    dashboard: () => apiRequest<Record<string, unknown>>(`${base}/website-intelligence/dashboard`),
    listAudits: (params?: { q?: string; status?: string }) => {
      const search = new URLSearchParams()
      if (params?.q) search.set('q', params.q)
      if (params?.status) search.set('status', params.status)
      const qs = search.toString()
      return apiRequest<{ items: unknown[] }>(
        `${base}/website-intelligence/audits${qs ? `?${qs}` : ''}`,
      )
    },
    createAudit: (body: Record<string, unknown>) =>
      apiRequest(`${base}/website-intelligence/audits`, { method: 'POST', json: body }),
    getAudit: (id: string) =>
      apiRequest<Record<string, unknown>>(`${base}/website-intelligence/audits/${id}`),
    exportAudit: (id: string) =>
      apiRequest<Record<string, unknown>>(`${base}/website-intelligence/audits/${id}/export`),
    cancelAudit: (id: string) =>
      apiRequest(`${base}/website-intelligence/audits/${id}/cancel`, { method: 'POST' }),
  },
  search: (q: string) =>
    apiRequest<Record<string, unknown>>(`${base}/search?q=${encodeURIComponent(q)}`),
  auditLogs: () => apiRequest<{ items: unknown[] }>(`${base}/audit-logs`),
  automationLogs: () => apiRequest<{ items: unknown[] }>(`${base}/audit-logs/automation`),
  leads: {
    list: (params?: {
      status?: string
      q?: string
      channel?: 'start_project' | 'contact' | 'other'
      followUp?: 'overdue' | 'today' | 'upcoming' | 'none'
      locality?: 'erode' | 'tamil_nadu' | 'india' | 'international'
      market?: 'us' | 'uk' | 'ca' | 'au' | 'ae' | 'sg'
    }) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.q) search.set('q', params.q)
      if (params?.channel) search.set('channel', params.channel)
      if (params?.followUp) search.set('followUp', params.followUp)
      if (params?.locality) search.set('locality', params.locality)
      if (params?.market) search.set('market', params.market)
      const qs = search.toString()
      return apiRequest<{ items: unknown[] }>(`${base}/leads${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/leads/${id}`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/leads`, { method: 'POST', json: body }),
    createProject: (leadId: string) =>
      apiRequest(`${base}/leads/${leadId}/create-project`, { method: 'POST' }),
    update: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/leads/${id}`, { method: 'PATCH', json: body }),
    addNote: (id: string, content: string) =>
      apiRequest(`${base}/leads/${id}/notes`, { method: 'POST', json: { content } }),
    assign: (id: string, employeeId: string) =>
      apiRequest(`${base}/leads/${id}/assign`, { method: 'POST', json: { employeeId } }),
    scheduleFollowUp: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/leads/${id}/follow-up`, { method: 'POST', json: body }),
    logInteraction: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/leads/${id}/interactions`, { method: 'POST', json: body }),
    convert: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/leads/${id}/convert`, { method: 'POST', json: body }),
    activity: (id: string) => apiRequest<{ items: unknown[] }>(`${base}/leads/${id}/activity`),
  },
  customers: {
    list: (q?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`,
      ),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/customers/${id}`),
  },
  employees: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/employees`),
    accessReview: () =>
      apiRequest<{ items: unknown[]; count: number }>(`${base}/employees/access-review`),
    invite: (body: Record<string, unknown>) =>
      apiRequest(`${base}/employees/invite`, { method: 'POST', json: body }),
    updateOrg: (employeeId: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/employees/${employeeId}/org`, { method: 'PATCH', json: body }),
    setStatus: (userId: string, status: string) =>
      apiRequest(`${base}/users/${userId}/status`, { method: 'PATCH', json: { status } }),
  },
  projects: {
    list: (params?: { status?: string; q?: string }) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.q) search.set('q', params.q)
      const qs = search.toString()
      return apiRequest<{ items: unknown[]; count: number }>(
        `${base}/projects${qs ? `?${qs}` : ''}`,
      )
    },
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/projects/${id}`),
    update: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/projects/${id}`, { method: 'PATCH', json: body }),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/projects`, { method: 'POST', json: body }),
    assignMember: (projectId: string, body: { employeeId: string; role: string }) =>
      apiRequest(`${base}/projects/${projectId}/members`, { method: 'POST', json: body }),
    listMembers: (projectId: string) =>
      apiRequest<{ items: unknown[] }>(`${base}/projects/${projectId}/members`),
    listMemberCandidates: (projectId: string) =>
      apiRequest<{ items: unknown[] }>(`${base}/projects/${projectId}/member-candidates`),
    addMember: (projectId: string, body: { employeeId: string; role: string }) =>
      apiRequest(`${base}/projects/${projectId}/members`, { method: 'POST', json: body }),
    updateMemberRole: (projectId: string, memberId: string, body: { role: string }) =>
      apiRequest(`${base}/projects/${projectId}/members/${memberId}`, {
        method: 'PATCH',
        json: body,
      }),
    removeMember: (projectId: string, memberId: string) =>
      apiRequest(`${base}/projects/${projectId}/members/${memberId}`, { method: 'DELETE' }),
    applyTemplate: (projectId: string, templateId: string) =>
      apiRequest(`${base}/projects/${projectId}/apply-template`, {
        method: 'POST',
        json: { templateId },
      }),
    complete: (projectId: string) =>
      apiRequest(`${base}/projects/${projectId}/complete`, { method: 'POST' }),
    start: (projectId: string) =>
      apiRequest(`${base}/projects/${projectId}/start`, { method: 'POST' }),
    createMilestone: (projectId: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/projects/${projectId}/milestones`, { method: 'POST', json: body }),
    updateMilestone: (milestoneId: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/milestones/${milestoneId}`, { method: 'PATCH', json: body }),
    reorderMilestone: (projectId: string, milestoneId: string, direction: 'up' | 'down') =>
      apiRequest(`${base}/projects/${projectId}/milestones/${milestoneId}/reorder`, {
        method: 'POST',
        json: { direction },
      }),
    listFiles: (projectId: string) =>
      apiRequest<{ items: unknown[] }>(`${base}/projects/${projectId}/files`),
    prepareUpload: (
      projectId: string,
      body: Record<string, unknown>,
    ) =>
      apiRequest<{
        file: { id: string }
        upload:
          | { configured: true; signedUrl: string; token: string; path: string }
          | { configured: false; message: string }
      }>(`${base}/projects/${projectId}/files/upload`, { method: 'POST', json: body }),
    finalizeUpload: (projectId: string, fileId: string) =>
      apiRequest(`${base}/projects/${projectId}/files/${fileId}/finalize`, { method: 'POST' }),
    updateFile: (projectId: string, fileId: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/projects/${projectId}/files/${fileId}`, { method: 'PATCH', json: body }),
    downloadFile: (projectId: string, fileId: string) =>
      apiRequest<{ configured: boolean; url?: string; message?: string }>(
        `${base}/projects/${projectId}/files/${fileId}/download`,
      ),
    listTasks: (
      projectId: string,
      params?: {
        status?: string
        priority?: string
        milestoneId?: string
        assigneeEmployeeId?: string
        overdueOnly?: boolean
      },
    ) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.priority) search.set('priority', params.priority)
      if (params?.milestoneId) search.set('milestoneId', params.milestoneId)
      if (params?.assigneeEmployeeId) search.set('assigneeEmployeeId', params.assigneeEmployeeId)
      if (params?.overdueOnly) search.set('overdueOnly', 'true')
      const qs = search.toString()
      return apiRequest<{ items: unknown[] }>(
        `${base}/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`,
      )
    },
    createTask: (projectId: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/projects/${projectId}/tasks`, { method: 'POST', json: body }),
    getTask: (projectId: string, taskId: string) =>
      apiRequest(`${base}/projects/${projectId}/tasks/${taskId}`),
    updateTask: (projectId: string, taskId: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/projects/${projectId}/tasks/${taskId}`, { method: 'PATCH', json: body }),
    completeTask: (projectId: string, taskId: string) =>
      apiRequest(`${base}/projects/${projectId}/tasks/${taskId}/complete`, { method: 'POST' }),
    cancelTask: (projectId: string, taskId: string) =>
      apiRequest(`${base}/projects/${projectId}/tasks/${taskId}/cancel`, { method: 'POST' }),
  },
  tasks: {
    list: (projectId?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/tasks${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
      ),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/tasks`, { method: 'POST', json: body }),
    update: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/tasks/${id}`, { method: 'PATCH', json: body }),
  },
  proposals: {
    list: (params?: { status?: string; q?: string }) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.q) search.set('q', params.q)
      const qs = search.toString()
      return apiRequest<{ items: unknown[]; count: number }>(
        `${base}/proposals${qs ? `?${qs}` : ''}`,
      )
    },
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/proposals/${id}`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/proposals`, { method: 'POST', json: body }),
    update: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/proposals/${id}`, { method: 'PATCH', json: body }),
    send: (id: string) => apiRequest(`${base}/proposals/${id}/send`, { method: 'POST' }),
    cancel: (id: string) => apiRequest(`${base}/proposals/${id}/cancel`, { method: 'POST' }),
    createFromLead: (leadId: string, body?: Record<string, unknown>) =>
      apiRequest(`${base}/leads/${leadId}/create-proposal`, { method: 'POST', json: body ?? {} }),
    createFromProject: (projectId: string, body?: Record<string, unknown>) =>
      apiRequest(`${base}/projects/${projectId}/create-proposal`, {
        method: 'POST',
        json: body ?? {},
      }),
  },
  invoices: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/invoices`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/invoices`, { method: 'POST', json: body }),
    issue: (id: string) => apiRequest(`${base}/invoices/${id}/issue`, { method: 'POST' }),
  },
  payments: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/payments`),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/payments/${id}`),
  },
  support: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/support`),
    update: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/support/${id}`, { method: 'PATCH', json: body }),
  },
  files: {
    list: (projectId?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/files${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
      ),
  },
  messages: {
    list: (projectId?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/messages${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
      ),
  },
  conversations: {
    list: (query?: { status?: string; unreadOnly?: boolean }) => {
      const params = new URLSearchParams()
      if (query?.status) params.set('status', query.status)
      if (query?.unreadOnly) params.set('unreadOnly', 'true')
      const qs = params.toString()
      return apiRequest<{ items: AdminConversationListItem[] }>(
        `${base}/conversations${qs ? `?${qs}` : ''}`,
      )
    },
    get: (id: string) =>
      apiRequest<{ conversation: AdminConversationListItem; messages: AdminConversationMessage[] }>(
        `${base}/conversations/${id}`,
      ),
    sendMessage: (id: string, body: string) =>
      apiRequest(`${base}/conversations/${id}/messages`, { method: 'POST', json: { body } }),
    markRead: (id: string) =>
      apiRequest(`${base}/conversations/${id}/read`, { method: 'POST' }),
    setStatus: (id: string, status: 'open' | 'closed') =>
      apiRequest(`${base}/conversations/${id}/close`, { method: 'POST', json: { status } }),
  },
}
