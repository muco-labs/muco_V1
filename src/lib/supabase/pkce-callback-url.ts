import { PKCE_FLOW_ID_QUERY_PARAM } from '@/lib/auth/oauth-callback-diagnostics'

/** When Supabase omits `sb_flow_id` on callback, recover it from the PKCE verifier cookie name. */
export function ensurePkceFlowIdOnCallbackUrl(storageKey: string): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (!params.has('code')) return
  if (params.get(PKCE_FLOW_ID_QUERY_PARAM)?.trim()) return

  const prefix = `${storageKey}-flow-`
  const suffix = '-code-verifier'

  for (const part of document.cookie.split(';')) {
    const name = part.trim().split('=')[0]?.trim()
    if (!name?.startsWith(prefix) || !name.endsWith(suffix)) continue
    const flowId = name.slice(prefix.length, name.length - suffix.length)
    if (!flowId) continue

    const url = new URL(window.location.href)
    url.searchParams.set(PKCE_FLOW_ID_QUERY_PARAM, flowId)
    window.history.replaceState(window.history.state, '', url.toString())
    break
  }
}
