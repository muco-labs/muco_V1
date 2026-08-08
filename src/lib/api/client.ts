import { env } from '@/config/env'
import { ApiError } from '@/services/api'
import type { ApiBody } from '@/lib/api/types'
import { isApiSuccess } from '@/lib/api/types'

function resolveUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const base = env.apiBaseUrl.replace(/\/$/, '')
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${base}${normalized}`
}

export async function apiPost<TResponse>(
  path: string,
  json: unknown,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetch(resolveUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    body: JSON.stringify(json),
    credentials: 'same-origin',
    ...init,
  })

  const body = (await response.json().catch(() => null)) as ApiBody<TResponse> | null

  if (!body || typeof body !== 'object' || !('success' in body)) {
    throw new ApiError('Unexpected server response', response.status || 500)
  }

  if (!isApiSuccess(body)) {
    throw new ApiError(body.error.message || 'Request failed', response.status || 400)
  }

  if (!response.ok) {
    throw new ApiError('Request failed', response.status)
  }

  return body.data
}
