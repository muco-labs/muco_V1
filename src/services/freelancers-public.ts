import { apiRequest } from './api'

const base = '/api/v1/freelancers'

export async function fetchFreelancerServiceCategories() {
  return apiRequest<{ items: Array<{ id: string; label: string }> }>(`${base}/service-categories`)
}

export async function submitFreelancerApplication(body: Record<string, unknown>) {
  return apiRequest<{ id: string; reference: string }>(`${base}/apply`, {
    method: 'POST',
    json: body,
  })
}
