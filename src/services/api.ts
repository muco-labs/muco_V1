import { env } from '@/config/env'
import { isAllowedApiUrl } from '@/utils/url'

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

/**
 * Shared fetch wrapper for future app.mucolabs.com APIs.
 * Public marketing site should not embed secrets; use env-based origins only.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  if (!isAllowedApiUrl(path)) {
    throw new ApiError('Invalid request URL', 0)
  }

  const { json, headers, timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = options
  const controller = new AbortController()
  const clearSchedule = scheduleTimeout(() => controller.abort(), timeoutMs)

  const abortFromCaller = () => controller.abort()
  signal?.addEventListener('abort', abortFromCaller, { once: true })

  try {
    const response = await fetch(path, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : rest.body,
      credentials: 'same-origin',
    })

    if (!response.ok) {
      throw new ApiError('Request failed', response.status)
    }

    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
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
