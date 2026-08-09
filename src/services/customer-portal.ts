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
    progressPercent?: number | null
    currentMilestone?: {
      name: string
      statusLabel: string
      dueDate: string | null
      dueHint?: string | null
      overdueNote?: string | null
    } | null
    milestonesSummary?: 'none' | 'in_progress' | 'complete'
  }>
  planningProjects?: Array<{
    id: string
    reference: string
    name: string
    status: string
    statusLabel?: string
    updatedAt: string
    progressPercent?: number | null
    currentMilestone?: {
      name: string
      statusLabel: string
      dueDate: string | null
    } | null
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
  openSupportTickets: Array<{ id: string; subject: string; status: string }>
  recentNotifications: Array<{ id: string; title: string; read: boolean; createdAt: string }>
  unreadNotificationCount: number
  messagesUnreadCount?: number
  latestConversation?: {
    id: string
    subject: string
    contextLabel: string
    unreadCount: number
    latestMessage?: { body: string; createdAt: string } | null
    updatedAt: string
  } | null
}

export type CustomerConversationListItem = {
  id: string
  subject: string
  status: string
  statusLabel: string
  contextLabel: string
  contextReference: string | null
  createdAt: string
  updatedAt: string
  unreadCount: number
  latestMessage?: { body: string; createdAt: string; senderLabel: string } | null
}

export type CustomerConversationMessage = {
  id: string
  body: string
  senderType: 'customer' | 'team'
  senderLabel: string
  createdAt: string
  read: boolean
}

export type CustomerProjectFile = {
  id: string
  fileName: string
  mimeType: string
  sizeBytes: number
  category: string
  uploadedAt: string
  isDeliverable: boolean
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
    listFiles: (projectId: string) =>
      apiRequest<{ documents: CustomerProjectFile[]; deliverables: CustomerProjectFile[] }>(
        `${base}/projects/${projectId}/files`,
      ),
    prepareUpload: (
      projectId: string,
      body: { fileName: string; mimeType: string; fileSizeBytes: number; category?: string },
    ) =>
      apiRequest<{
        file: { id: string; fileName: string }
        upload:
          | { configured: true; signedUrl: string; token: string; path: string }
          | { configured: false; message: string }
      }>(`${base}/projects/${projectId}/files/upload`, { method: 'POST', json: body }),
    finalizeUpload: (projectId: string, fileId: string) =>
      apiRequest<CustomerProjectFile>(`${base}/projects/${projectId}/files/${fileId}/finalize`, {
        method: 'POST',
      }),
    downloadFile: (projectId: string, fileId: string) =>
      apiRequest<{
        configured: boolean
        url?: string
        fileName?: string
        message?: string
        expiresInSeconds?: number
      }>(`${base}/projects/${projectId}/files/${fileId}/download`),
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
    startPayment: (id: string) =>
      apiRequest<Record<string, unknown>>(`${base}/proposals/${id}/payment`, { method: 'POST' }),
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
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/payments/${id}`),
    verify: (
      id: string,
      body: {
        razorpayOrderId: string
        razorpayPaymentId: string
        razorpaySignature: string
      },
    ) =>
      apiRequest(`${base}/payments/${id}/verify`, {
        method: 'POST',
        json: body,
      }),
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
    listLegacy: (projectId?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/messages${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
      ),
    sendLegacy: (body: { body: string; projectId?: string }) =>
      apiRequest(`${base}/messages`, { method: 'POST', json: body }),
  },
  conversations: {
    list: () => apiRequest<{ items: CustomerConversationListItem[] }>(`${base}/conversations`),
    get: (id: string) =>
      apiRequest<{ conversation: CustomerConversationListItem; messages: CustomerConversationMessage[] }>(
        `${base}/conversations/${id}`,
      ),
    create: (body: {
      subject?: string
      body?: string
      projectId?: string
      leadId?: string
      proposalId?: string
    }) => apiRequest<CustomerConversationListItem>(`${base}/conversations`, { method: 'POST', json: body }),
    sendMessage: (id: string, body: string) =>
      apiRequest<CustomerConversationMessage>(`${base}/conversations/${id}/messages`, {
        method: 'POST',
        json: { body },
      }),
    markRead: (id: string) =>
      apiRequest(`${base}/conversations/${id}/read`, { method: 'POST' }),
    close: (id: string) =>
      apiRequest(`${base}/conversations/${id}/close`, { method: 'POST' }),
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
