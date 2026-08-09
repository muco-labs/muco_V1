import { apiRequest } from './api'

const base = '/api/v1/freelancer'

export const freelancerApi = {
  dashboard: () =>
    apiRequest<{ profile: Record<string, unknown>; assignmentsMessage: string }>(`${base}/dashboard`),
  profile: () => apiRequest<Record<string, unknown>>(`${base}/profile`),
  updateProfile: (body: Record<string, unknown>) =>
    apiRequest(`${base}/profile`, { method: 'PATCH', json: body }),
  updateAvailability: (body: Record<string, unknown>) =>
    apiRequest(`${base}/availability`, { method: 'PATCH', json: body }),
}
