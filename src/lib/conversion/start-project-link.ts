import type { ServiceSlug } from '@/config/routes'
import { startProjectPaths } from '@/config/start-project'

export type StartProjectLinkParams = {
  service?: ServiceSlug | string
  source?: string
}

export function startProjectHref(params?: StartProjectLinkParams): string {
  if (!params?.service && !params?.source) return startProjectPaths.entry
  const search = new URLSearchParams()
  if (params.service) search.set('service', params.service)
  if (params.source) search.set('source', params.source.slice(0, 40))
  const query = search.toString()
  return query ? `${startProjectPaths.entry}?${query}` : startProjectPaths.entry
}

export function readStartProjectPrefill(search: string): StartProjectLinkParams {
  const params = new URLSearchParams(search)
  return {
    service: params.get('service') ?? undefined,
    source: params.get('source') ?? undefined,
  }
}
