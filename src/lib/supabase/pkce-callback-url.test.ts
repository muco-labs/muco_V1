/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach } from 'vitest'
import { PKCE_FLOW_ID_QUERY_PARAM } from '@/lib/auth/oauth-callback-diagnostics'
import {
  ensurePkceFlowIdOnCallbackUrl,
  readPkceFlowIdFromVerifierCookies,
} from './pkce-callback-url'

describe('pkce-callback-url', () => {
  beforeEach(() => {
    document.cookie = ''
    window.history.replaceState({}, '', '/auth/callback?code=abc')
  })

  it('adds sb_flow_id from verifier cookie name', () => {
    const storageKey = 'sb-ltmaweunlnlpllrzzscq-auth-token'
    const flowId = '96b1c7f0fb9163a257c05c7e4485bedc'
    document.cookie = `${storageKey}-flow-${flowId}-code-verifier=test; path=/`

    const id = ensurePkceFlowIdOnCallbackUrl(storageKey)

    const params = new URLSearchParams(window.location.search)
    expect(params.get('code')).toBe('abc')
    expect(params.get(PKCE_FLOW_ID_QUERY_PARAM)).toBe(flowId)
    expect(id).toBe(flowId)
  })

  it('reads flow id from verifier cookie names', () => {
    const storageKey = 'sb-demo-auth-token'
    document.cookie = `${storageKey}-flow-abc123-code-verifier=x; path=/`
    expect(readPkceFlowIdFromVerifierCookies(storageKey)).toBe('abc123')
  })
})
