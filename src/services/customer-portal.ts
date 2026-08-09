import { apiRequest } from '@/services/api'

export type CustomerDashboard = {
  welcomeName: string
  companyName: string | null
  activeProjects: Array<{
    id: string
    reference: string
    name: string
    status: string
    statusLabel?: string
    updatedAt: string
  }>
  planningProjects?: Array<{
    id: string
    reference: string
    name: string
    status: string
    statusLabel?: string
    updatedAt: string
  }>
  recentProjects: Array<{
    id: string
    reference?: string
    name: string
    status: string
    progressPercent?: number | null
  }>
  pendingApprovals: Array<{ id: string; title: string | null; status: string }>
  outstandingInvoices: Array<{
    id: string
    invoiceNumber: string
    amount: string
    status: string
    dueDate: string | null
  }>
  recentPayments: Array<{ id: string; amount: string; status: string; createdAt: string }>
  recentMessages: Array<{ id: string; body: string; createdAt: string }>
  openSupportTickets: Array<{ id: string; subject: string; status: string }>
  recentNotifications: Array<{ id: string; title: string; read: boolean; createdAt: string }>
  unreadNotificationCount: number
}

const base = '/api/v1/customer'

export const customerApi = {
  dashboard: () => apiRequest<CustomerDashboard>(`${base}/dashboard`),
  profile: {
    get: () => apiRequest<Record<string, unknown>>(`${base}/profile`),
    update: (body: Record<string, unknown>) =>
      apiRequest(`${base}/profile`, { method: 'PATCH', json: body }),
  },
  projects: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/projects`),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/projects/${id}`),
  },
  proposals: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/proposals`),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/proposals/${id}`),
    approve: (id: string, note?: string) =>
      apiRequest(`${base}/proposals/${id}/approve`, { method: 'POST', json: { note } }),
    requestChanges: (id: string, note?: string) =>
      apiRequest(`${base}/proposals/${id}/request-changes`, { method: 'POST', json: { note } }),
    reject: (id: string, note?: string) =>
      apiRequest(`${base}/proposals/${id}/reject`, { method: 'POST', json: { note } }),
    accept: (id: string, note?: string) =>
      apiRequest(`${base}/proposals/${id}/accept`, { method: 'POST', json: { note } }),
    view: (id: string) => apiRequest<Record<string, unknown>>(`${base}/proposals/${id}/view`, { method: 'POST' }),
  },
  invoices: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/invoices`),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/invoices/${id}`),
    pay: (id: string) => apiRequest<Record<string, unknown>>(`${base}/invoices/${id}/pay`, { method: 'POST' }),
    verifyPayment: (body: Record<string, unknown>) =>
      apiRequest(`${base}/payments/verify`, { method: 'POST', json: body }),
  },
  payments: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/payments`),
  },
  files: {
    list: (projectId?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/files${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
      ),
    prepareUpload: (body: Record<string, unknown>) =>
      apiRequest(`${base}/files`, { method: 'POST', json: body }),
    download: (id: string) => apiRequest<Record<string, unknown>>(`${base}/files/${id}/download`),
  },
  messages: {
    list: (projectId?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/messages${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
      ),
    send: (body: { body: string; projectId?: string }) =>
      apiRequest(`${base}/messages`, { method: 'POST', json: body }),
  },
  support: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/support`),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/support/${id}`),
    create: (body: Record<string, unknown>) =>
      apiRequest(`${base}/support`, { method: 'POST', json: body }),
    reply: (id: string, body: string) =>
      apiRequest(`${base}/support/${id}/replies`, { method: 'POST', json: { body } }),
  },
  notifications: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/notifications`),
    markRead: (id: string) =>
      apiRequest(`${base}/notifications/${id}/read`, { method: 'PATCH' }),
  },
  projectRequests: {
    prefill: () => apiRequest<Record<string, unknown>>(`${base}/project-requests/prefill`),
    list: () =>
      apiRequest<{
        items: Array<{
          id: string
          status: string
          serviceInterest: string | null
          budget: string | null
          timeline: string | null
          createdAt: string
          updatedAt?: string
          summary: string
        }>
      }>(`${base}/project-requests`),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/project-requests/${id}`),
    create: (body: Record<string, unknown>) =>
      apiRequest<{ id: string; status: string }>(`${base}/project-requests`, {
        method: 'POST',
        json: body,
      }),
  },
}
