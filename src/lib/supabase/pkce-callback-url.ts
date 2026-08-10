import { PKCE_FLOW_ID_QUERY_PARAM, pkceVerifierSlotKey } from '@/lib/auth/oauth-callback-diagnostics'
import {
  readSharedAuthStorageValue,
} from '@/lib/supabase/cross-subdomain-auth-storage'

function decodeCookieName(raw: string): string {
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

/** Parse flow id from verifier cookie names for this storage key. */
export function readPkceFlowIdFromVerifierCookies(storageKey: string): string | null {
  if (typeof document === 'undefined') return null
  const prefix = `${storageKey}-flow-`
  const suffix = '-code-verifier'

  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const eq = trimmed.indexOf('=')
    const rawName = eq >= 0 ? trimmed.slice(0, eq).trim() : trimmed
    const name = decodeCookieName(rawName)
    if (!name.startsWith(prefix) || !name.endsWith(suffix)) continue
    const flowId = name.slice(prefix.length, name.length - suffix.length)
    if (flowId) return flowId
  }
  return null
}

/** When Supabase omits `sb_flow_id` on callback, recover it from the PKCE verifier cookie name. */
export function ensurePkceFlowIdOnCallbackUrl(storageKey: string): string | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  if (!params.has('code')) return null

  const existing = params.get(PKCE_FLOW_ID_QUERY_PARAM)?.trim()
  if (existing) return existing

  const flowId = readPkceFlowIdFromVerifierCookies(storageKey)
  if (!flowId) return null

  const url = new URL(window.location.href)
  url.searchParams.set(PKCE_FLOW_ID_QUERY_PARAM, flowId)
  window.history.replaceState(window.history.state, '', url.toString())
  return flowId
}

/** Ensure flow-scoped verifier is readable via Supabase storage adapter before initialize(). */
export function syncPkceVerifierIntoStorage(
  storageKey: string,
  flowId: string,
  storage: Storage,
): void {
  const slotKey = pkceVerifierSlotKey(storageKey, flowId)
  try {
    const existing = storage.getItem(slotKey)
    if (existing !== null && existing !== '') return
  } catch {
    /* continue */
  }

  const fromCookie = readSharedAuthStorageValue(slotKey)
  if (!fromCookie) return

  try {
    storage.setItem(slotKey, fromCookie)
  } catch {
    /* ignore */
  }
}

/** Run before auth.initialize on OAuth callback. */
export function preparePkceOAuthCallback(storageKey: string, storage: Storage): void {
  const flowIdFromUrl = ensurePkceFlowIdOnCallbackUrl(storageKey)
  const flowId =
    flowIdFromUrl ??
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get(PKCE_FLOW_ID_QUERY_PARAM)?.trim()
      : null) ??
    readPkceFlowIdFromVerifierCookies(storageKey)

  if (flowId) {
    syncPkceVerifierIntoStorage(storageKey, flowId, storage)
  }
}
