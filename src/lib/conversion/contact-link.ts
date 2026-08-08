import type { ServiceSlug } from '@/config/routes'
import { routePaths } from '@/config/routes'

export type ContactLinkParams = {
  service?: ServiceSlug | string
  source?: string
  project?: string
  city?: string
  state?: string
}

/** Builds contact URL with optional qualification prefill (no PII). */
export function contactHref(params?: ContactLinkParams): string {
  if (!params) return routePaths.contact
  const search = new URLSearchParams()
  if (params.service) search.set('service', params.service)
  if (params.source) search.set('source', params.source.slice(0, 40))
  if (params.project) search.set('project', params.project.slice(0, 80))
  if (params.city) search.set('city', params.city.slice(0, 80))
  if (params.state) search.set('state', params.state.slice(0, 80))
  const query = search.toString()
  return query ? `${routePaths.contact}?${query}` : routePaths.contact
}

export function readContactPrefill(search: string): ContactLinkParams {
  const params = new URLSearchParams(search)
  return {
    service: params.get('service') ?? undefined,
    source: params.get('source') ?? undefined,
    project: params.get('project') ?? undefined,
    city: params.get('city') ?? undefined,
    state: params.get('state') ?? undefined,
  }
}
