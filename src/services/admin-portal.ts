import { apiRequest } from '@/services/api'

const base = '/api/v1/admin'

export type AdminDashboard = {
  leadsNew: number
  qualifiedLeads: number
  activeProjects: number
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
  search: (q: string) =>
    apiRequest<Record<string, unknown>>(`${base}/search?q=${encodeURIComponent(q)}`),
  auditLogs: () => apiRequest<{ items: unknown[] }>(`${base}/audit-logs`),
  automationLogs: () => apiRequest<{ items: unknown[] }>(`${base}/audit-logs/automation`),
  leads: {
    list: (params?: {
      status?: string
      q?: string
      locality?: 'erode' | 'tamil_nadu' | 'india' | 'international'
      market?: 'us' | 'uk' | 'ca' | 'au' | 'ae' | 'sg'
    }) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.q) search.set('q', params.q)
      if (params?.locality) search.set('locality', params.locality)
      if (params?.market) search.set('market', params.market)
      const qs = search.toString()
      return apiRequest<{ items: unknown[] }>(`${base}/leads${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/leads/${id}`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/leads`, { method: 'POST', json: body }),
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
    invite: (body: Record<string, unknown>) =>
      apiRequest(`${base}/employees/invite`, { method: 'POST', json: body }),
    setStatus: (userId: string, status: string) =>
      apiRequest(`${base}/users/${userId}/status`, { method: 'PATCH', json: { status } }),
  },
  projects: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/projects`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/projects`, { method: 'POST', json: body }),
    assignMember: (projectId: string, body: { employeeId: string; role: string }) =>
      apiRequest(`${base}/projects/${projectId}/members`, { method: 'POST', json: body }),
    applyTemplate: (projectId: string, templateId: string) =>
      apiRequest(`${base}/projects/${projectId}/apply-template`, {
        method: 'POST',
        json: { templateId },
      }),
    complete: (projectId: string) =>
      apiRequest(`${base}/projects/${projectId}/complete`, { method: 'POST' }),
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
    list: () => apiRequest<{ items: unknown[] }>(`${base}/proposals`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/proposals`, { method: 'POST', json: body }),
    send: (id: string) => apiRequest(`${base}/proposals/${id}/send`, { method: 'POST' }),
  },
  invoices: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/invoices`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/invoices`, { method: 'POST', json: body }),
    issue: (id: string) => apiRequest(`${base}/invoices/${id}/issue`, { method: 'POST' }),
  },
  payments: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/payments`),
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
}
