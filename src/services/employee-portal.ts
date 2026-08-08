import { apiRequest } from '@/services/api'

const base = '/api/v1/employee'

export const employeeApi = {
  dashboard: () => apiRequest<Record<string, unknown>>(`${base}/dashboard`),
  profile: {
    get: () => apiRequest<Record<string, unknown>>(`${base}/profile`),
    update: (body: Record<string, unknown>) =>
      apiRequest(`${base}/profile`, { method: 'PATCH', json: body }),
  },
  tasks: {
    list: (params?: { status?: string; priority?: string; q?: string }) => {
      const search = new URLSearchParams()
      if (params?.status) search.set('status', params.status)
      if (params?.priority) search.set('priority', params.priority)
      if (params?.q) search.set('q', params.q)
      const qs = search.toString()
      return apiRequest<{ items: unknown[] }>(`${base}/tasks${qs ? `?${qs}` : ''}`)
    },
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/tasks/${id}`),
    update: (id: string, body: Record<string, unknown>) =>
      apiRequest(`${base}/tasks/${id}`, { method: 'PATCH', json: body }),
  },
  projects: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/projects`),
    get: (id: string) => apiRequest<Record<string, unknown>>(`${base}/projects/${id}`),
  },
  files: {
    list: (projectId?: string) =>
      apiRequest<{ items: unknown[] }>(
        `${base}/files${projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''}`,
      ),
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
  notifications: {
    list: () => apiRequest<{ items: unknown[] }>(`${base}/notifications`),
    markRead: (id: string) => apiRequest(`${base}/notifications/${id}/read`, { method: 'PATCH' }),
  },
  deadlines: () => apiRequest<{ items: unknown[] }>(`${base}/deadlines`),
}
