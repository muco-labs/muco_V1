import type { SupabaseClient } from '@supabase/supabase-js'
import type { AuthSessionFailurePoint } from '@/lib/supabase/wait-for-auth-session'
import {
  createSupabaseAuthStorage,
  isSharedMucolabsAuthStorageEnabled,
} from '@/lib/supabase/cross-subdomain-auth-storage'
import {
  hasSbPkceVerifierCookieKey,
  isAuthDiagnosticsEnabled,
  listSbStorageKeyNames,
  persistAuthDiagnosticsFlag,
} from '@/lib/auth/auth-diagnostics'

export const OAUTH_DIAG_REDIRECT_TO_KEY = 'muco_oauth_redirect_to'
export const OAUTH_DIAG_START_HOST_KEY = 'muco_oauth_start_hostname'
export const PKCE_FLOW_ID_QUERY_PARAM = 'sb_flow_id'

/** Failure stages for production OAuth callback triage (safe labels only). */
export type OAuthCallbackFailureStage =
  | 'A_initialize'
  | 'B_get_session'
  | 'C_pkce_exchange'
  | 'D_session_user_missing'
  | 'E_auth_me'
  | 'F_profile_registration'
  | 'G_post_auth_navigation'
  | null

export type OAuthCallbackDiagnosticSnapshot = {
  pathname: string
  hostname: string
  hasOAuthCode: boolean
  hasPkceFlowId: boolean
  oauthRedirectToRequested: string | null
  oauthStartHostname: string | null
  callbackHost: string
  hostChangedFromOAuthStart: boolean
  hostChangedFromRedirectTo: boolean
  sharedCookieStorageEnabled: boolean
  authInitializeOk: boolean
  authInitializeErrorName: string | null
  authInitializeErrorMessage: string | null
  getSessionErrorName: string | null
  getSessionErrorMessage: string | null
  sessionExists: boolean
  userExists: boolean
  failureStage: OAuthCallbackFailureStage
  storageKeyExpected: string | null
  storageKeyActual: string | null
  verifierKeyExpected: string | null
  verifierSlotKeyExpected: string | null
  pkceCookieKeyActual: string | null
  verifierCookieKeyPresent: boolean
  verifierReadable: boolean
  verifierSlotReadable: boolean
  verifierJsonParsable: boolean
  verifierSlotJsonParsable: boolean
  pkceCallbackWouldRun: boolean
  initializeCalled: boolean
  sessionStorageReadable: boolean
  sessionJsonParsable: boolean
  meHttpStatus: number | null
  profileSuccess: boolean
  registrationAttempted: boolean
  registrationFailed: boolean
  finalDestination: string | null
  navigationStarted: boolean
}

type AuthClientInternals = {
  storageKey: string
  storage: Storage
}

export function pkceVerifierSlotKey(storageKey: string, flowId: string): string {
  return `${storageKey}-flow-${flowId}-code-verifier`
}

export function readPkceFlowIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null
  const raw = new URLSearchParams(window.location.search).get(PKCE_FLOW_ID_QUERY_PARAM)
  return raw?.trim() ? raw.trim() : null
}

export function readOAuthDiagRedirectToRequested(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const value = sessionStorage.getItem(OAUTH_DIAG_REDIRECT_TO_KEY)
    return value?.trim() ? value.trim() : null
  } catch {
    return null
  }
}

export function readOAuthDiagStartHostname(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const value = sessionStorage.getItem(OAUTH_DIAG_START_HOST_KEY)
    return value?.trim() ? value.trim() : null
  } catch {
    return null
  }
}

export function recordOAuthFlowDiagnosticsAtStart(redirectTo: string | undefined): void {
  if (!isAuthDiagnosticsEnabled()) return
  persistAuthDiagnosticsFlag()
  try {
    sessionStorage.setItem(OAUTH_DIAG_REDIRECT_TO_KEY, redirectTo ?? '')
    sessionStorage.setItem(OAUTH_DIAG_START_HOST_KEY, window.location.hostname)
  } catch {
    /* ignore */
  }
}

function hostFromUrl(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return null
  }
}

/** First matching sb-*-code-verifier cookie name (name only). */
export function resolvePkceVerifierCookieKeyActual(cookieNames: string[]): string | null {
  const match = cookieNames.find((name) => name.includes('-code-verifier'))
  return match ?? null
}

export function wouldSupabaseTreatAsPkceCallback(
  storage: Storage,
  storageKey: string | null,
  hasOAuthCode: boolean,
  flowId: string | null,
): boolean {
  if (!hasOAuthCode || !storageKey) return false
  if (flowId) {
    const slot = inspectVerifierStorageRead(storage, pkceVerifierSlotKey(storageKey, flowId))
    if (slot.verifierReadable) return true
  }
  const legacy = inspectVerifierStorageRead(storage, `${storageKey}-code-verifier`)
  return legacy.verifierReadable
}

export function getSupabaseClientStorageKey(client: SupabaseClient): string | null {
  const auth = client.auth as unknown as Partial<AuthClientInternals>
  return typeof auth.storageKey === 'string' ? auth.storageKey : null
}

function getClientAuthStorage(client: SupabaseClient): Storage {
  const auth = client.auth as unknown as Partial<AuthClientInternals>
  if (auth.storage) return auth.storage
  return createSupabaseAuthStorage()
}

/** Cookie name for auth session key if present (name only, no value). */
export function resolveActualAuthStorageCookieKey(
  storageKey: string | null,
  cookieNames: string[],
): string | null {
  if (!storageKey) return null
  if (cookieNames.includes(storageKey)) return storageKey
  if (cookieNames.includes(`${storageKey}__chunk_count`)) return storageKey
  const tokenKeys = cookieNames.filter(
    (name) => name.startsWith('sb-') && name.endsWith('-auth-token') && !name.includes('code-verifier'),
  )
  return tokenKeys[0] ?? null
}

export function inspectVerifierStorageRead(
  storage: Storage,
  verifierKey: string | null,
): { verifierReadable: boolean; verifierJsonParsable: boolean } {
  if (!verifierKey) {
    return { verifierReadable: false, verifierJsonParsable: false }
  }
  let raw: string | null = null
  try {
    raw = storage.getItem(verifierKey)
  } catch {
    raw = null
  }
  if (raw === null || raw === '') {
    return { verifierReadable: false, verifierJsonParsable: false }
  }
  try {
    JSON.parse(raw)
    return { verifierReadable: true, verifierJsonParsable: true }
  } catch {
    return { verifierReadable: true, verifierJsonParsable: false }
  }
}

export function inspectSessionStorageRead(
  storage: Storage,
  storageKey: string | null,
): { sessionStorageReadable: boolean; sessionJsonParsable: boolean } {
  if (!storageKey) {
    return { sessionStorageReadable: false, sessionJsonParsable: false }
  }
  let raw: string | null = null
  try {
    raw = storage.getItem(storageKey)
  } catch {
    raw = null
  }
  if (raw === null || raw === '') {
    return { sessionStorageReadable: false, sessionJsonParsable: false }
  }
  try {
    JSON.parse(raw)
    return { sessionStorageReadable: true, sessionJsonParsable: true }
  } catch {
    return { sessionStorageReadable: true, sessionJsonParsable: false }
  }
}

export function mapSessionFailureToStage(
  failurePoint: AuthSessionFailurePoint,
): OAuthCallbackFailureStage {
  switch (failurePoint) {
    case 'initialize':
      return 'A_initialize'
    case 'get_session':
      return 'B_get_session'
    case 'pkce_exchange_skipped_or_failed':
      return 'C_pkce_exchange'
    default:
      return null
  }
}

export function buildStorageDiagnosticFields(client: SupabaseClient): Pick<
  OAuthCallbackDiagnosticSnapshot,
  | 'storageKeyExpected'
  | 'storageKeyActual'
  | 'verifierKeyExpected'
  | 'verifierSlotKeyExpected'
  | 'pkceCookieKeyActual'
  | 'verifierCookieKeyPresent'
  | 'verifierReadable'
  | 'verifierSlotReadable'
  | 'verifierJsonParsable'
  | 'verifierSlotJsonParsable'
  | 'pkceCallbackWouldRun'
  | 'sessionStorageReadable'
  | 'sessionJsonParsable'
  | 'sharedCookieStorageEnabled'
> {
  const storageKeyExpected = getSupabaseClientStorageKey(client)
  const flowId = readPkceFlowIdFromLocation()
  const verifierKeyExpected = storageKeyExpected ? `${storageKeyExpected}-code-verifier` : null
  const verifierSlotKeyExpected =
    storageKeyExpected && flowId ? pkceVerifierSlotKey(storageKeyExpected, flowId) : null
  const cookieNames = listSbStorageKeyNames()
  const storageKeyActual = resolveActualAuthStorageCookieKey(storageKeyExpected, cookieNames)
  const pkceCookieKeyActual = resolvePkceVerifierCookieKeyActual(cookieNames)
  const storage = getClientAuthStorage(client)
  const verifierRead = inspectVerifierStorageRead(storage, verifierKeyExpected)
  const slotRead = inspectVerifierStorageRead(storage, verifierSlotKeyExpected)
  const sessionRead = inspectSessionStorageRead(storage, storageKeyExpected)
  const verifierCookieKeyPresent =
    hasSbPkceVerifierCookieKey() ||
    (verifierKeyExpected !== null && cookieNames.includes(verifierKeyExpected)) ||
    (verifierSlotKeyExpected !== null && cookieNames.includes(verifierSlotKeyExpected))

  const hasOAuthCode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('code')

  return {
    storageKeyExpected,
    storageKeyActual,
    verifierKeyExpected,
    verifierSlotKeyExpected,
    pkceCookieKeyActual,
    verifierCookieKeyPresent,
    verifierReadable: verifierRead.verifierReadable,
    verifierSlotReadable: slotRead.verifierReadable,
    verifierJsonParsable: verifierRead.verifierJsonParsable,
    verifierSlotJsonParsable: slotRead.verifierJsonParsable,
    pkceCallbackWouldRun: wouldSupabaseTreatAsPkceCallback(
      storage,
      storageKeyExpected,
      hasOAuthCode,
      flowId,
    ),
    ...sessionRead,
    sharedCookieStorageEnabled: isSharedMucolabsAuthStorageEnabled(),
  }
}

export function buildOAuthHostDiagnosticFields(): Pick<
  OAuthCallbackDiagnosticSnapshot,
  | 'hostname'
  | 'hasPkceFlowId'
  | 'oauthRedirectToRequested'
  | 'oauthStartHostname'
  | 'callbackHost'
  | 'hostChangedFromOAuthStart'
  | 'hostChangedFromRedirectTo'
> {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const callbackHost = hostname
  const oauthRedirectToRequested = readOAuthDiagRedirectToRequested()
  const oauthStartHostname = readOAuthDiagStartHostname()
  const redirectHost = hostFromUrl(oauthRedirectToRequested)
  return {
    hostname,
    hasPkceFlowId: Boolean(readPkceFlowIdFromLocation()),
    oauthRedirectToRequested,
    oauthStartHostname,
    callbackHost,
    hostChangedFromOAuthStart: Boolean(
      oauthStartHostname && oauthStartHostname !== callbackHost,
    ),
    hostChangedFromRedirectTo: Boolean(redirectHost && redirectHost !== callbackHost),
  }
}

export function createEmptyOAuthCallbackSnapshot(
  partial: Partial<OAuthCallbackDiagnosticSnapshot> = {},
): OAuthCallbackDiagnosticSnapshot {
  return {
    pathname: typeof window !== 'undefined' ? window.location.pathname : '',
    hostname: typeof window !== 'undefined' ? window.location.hostname : '',
    hasOAuthCode:
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('code'),
    hasPkceFlowId: Boolean(readPkceFlowIdFromLocation()),
    oauthRedirectToRequested: readOAuthDiagRedirectToRequested(),
    oauthStartHostname: readOAuthDiagStartHostname(),
    callbackHost: typeof window !== 'undefined' ? window.location.hostname : '',
    hostChangedFromOAuthStart: false,
    hostChangedFromRedirectTo: false,
    sharedCookieStorageEnabled: isSharedMucolabsAuthStorageEnabled(),
    authInitializeOk: false,
    initializeCalled: false,
    authInitializeErrorName: null,
    authInitializeErrorMessage: null,
    getSessionErrorName: null,
    getSessionErrorMessage: null,
    sessionExists: false,
    userExists: false,
    failureStage: null,
    storageKeyExpected: null,
    storageKeyActual: null,
    verifierKeyExpected: null,
    verifierSlotKeyExpected: null,
    pkceCookieKeyActual: null,
    verifierCookieKeyPresent: false,
    verifierReadable: false,
    verifierSlotReadable: false,
    verifierJsonParsable: false,
    verifierSlotJsonParsable: false,
    pkceCallbackWouldRun: false,
    sessionStorageReadable: false,
    sessionJsonParsable: false,
    meHttpStatus: null,
    profileSuccess: false,
    registrationAttempted: false,
    registrationFailed: false,
    finalDestination: null,
    navigationStarted: false,
    ...partial,
  }
}

export function formatOAuthCallbackDiagnosticSnapshot(
  snapshot: OAuthCallbackDiagnosticSnapshot,
): string {
  return JSON.stringify(snapshot, null, 2)
}

export function shouldShowOAuthCallbackDiagnostics(): boolean {
  persistAuthDiagnosticsFlag()
  return isAuthDiagnosticsEnabled()
}
