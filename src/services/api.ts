import { env } from '@/config/env'
import { isAllowedApiUrl } from '@/utils/url'
import type { ApiBody } from '@/lib/api/types'
import { isApiSuccess } from '@/lib/api/types'
import { getAccessToken } from '@/lib/supabase/client'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type RequestOptions = RequestInit & {
  json?: unknown
  timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 15_000

function scheduleTimeout(callback: () => void, ms: number): () => void {
  if (typeof window === 'undefined') {
    return () => undefined
  }
  const id = window.setTimeout(callback, ms)
  return () => window.clearTimeout(id)
}

function resolveRequestUrl(path: string): string {
  if (path.startsWith('/')) {
    return path
  }
  return path
}

/**
 * Shared fetch wrapper for future app.mucolabs.com APIs.
 * Public marketing site should not embed secrets; use env-based origins only.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const target = resolveRequestUrl(path)
  if (!isAllowedApiUrl(target)) {
    throw new ApiError('Invalid request URL', 0)
  }

  const { json, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = options
  const controller = new AbortController()
  const clearSchedule = scheduleTimeout(() => controller.abort(), timeoutMs)

  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const accessToken = await getAccessToken()
    const response = await fetch(target, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: 'same-origin',
    })

    if (response.status === 204) {
      return undefined as T
    }

    const parsed = (await response.json().catch(() => null)) as ApiBody<T> | T | null

    if (parsed && typeof parsed === 'object' && 'success' in parsed) {
      const envelope = parsed as ApiBody<T>
      if (!isApiSuccess(envelope)) {
        throw new ApiError(envelope.error.message || 'Request failed', response.status)
      }
      if (!response.ok) {
        throw new ApiError('Request failed', response.status)
      }
      return envelope.data
    }

    if (!response.ok) {
      throw new ApiError('Request failed', response.status)
    }

    return parsed as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError('Request timed out', 408)
    }
    throw new ApiError('Network error', 0)
  } finally {
    clearSchedule()
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

export const api = {
  appOrigin: env.appUrl,
}
