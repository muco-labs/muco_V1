import { apiRequest } from './api'

const base = '/api/v1/freelancer'

export type FreelancerProjectSummary = {
  id: string
  reference: string
  name: string
  status: string
  statusLabel: string
  projectRole: string
  projectRoleLabel: string
  assignedTaskCount: number
  activeTaskCount: number
}

export type FreelancerTask = {
  id: string
  reference: string
  projectId: string
  title: string
  status: string
  statusLabel: string
  priority: string
  dueDate: string | null
  overdue: boolean
  milestoneName: string | null
  nextAction: string | null
}

export const freelancerApi = {
  dashboard: () =>
    apiRequest<{
      profile: Record<string, unknown>
      projects: FreelancerProjectSummary[]
      assignmentsMessage: string | null
    }>(`${base}/dashboard`),
  listProjects: () => apiRequest<{ items: FreelancerProjectSummary[] }>(`${base}/projects`),
  getProject: (id: string) =>
    apiRequest<FreelancerProjectSummary & { milestones: unknown[]; tasks: FreelancerTask[] }>(
      `${base}/projects/${id}`,
    ),
  listTasks: (projectId?: string) => {
    const qs = projectId ? `?projectId=${encodeURIComponent(projectId)}` : ''
    return apiRequest<{ items: FreelancerTask[] }>(`${base}/tasks${qs}`)
  },
  updateTaskStatus: (taskId: string, status: string) =>
    apiRequest(`${base}/tasks/${taskId}`, { method: 'PATCH', json: { status } }),
  profile: () => apiRequest<Record<string, unknown>>(`${base}/profile`),
  updateProfile: (body: Record<string, unknown>) =>
    apiRequest(`${base}/profile`, { method: 'PATCH', json: body }),
  updateAvailability: (body: Record<string, unknown>) =>
    apiRequest(`${base}/availability`, { method: 'PATCH', json: body }),
  serviceCatalog: () =>
    apiRequest<{ items: Array<Record<string, unknown>> }>(`${base}/services/catalog`),
  listServices: () => apiRequest<{ items: unknown[] }>(`${base}/services`),
  createService: (body: Record<string, unknown>) =>
    apiRequest(`${base}/services`, { method: 'POST', json: body }),
  updateService: (id: string, body: Record<string, unknown>) =>
    apiRequest(`${base}/services/${id}`, { method: 'PATCH', json: body }),
  deleteService: (id: string) => apiRequest(`${base}/services/${id}`, { method: 'DELETE' }),
  listSkills: () => apiRequest<{ items: unknown[] }>(`${base}/skills`),
  createSkill: (body: Record<string, unknown>) =>
    apiRequest(`${base}/skills`, { method: 'POST', json: body }),
  deleteSkill: (id: string) => apiRequest(`${base}/skills/${id}`, { method: 'DELETE' }),
}
