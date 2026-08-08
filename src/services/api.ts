import { env } from '@/config/env'

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
}

/**
 * Shared fetch wrapper for future app.mucolabs.com APIs.
 * Public marketing site should not embed secrets; use env-based origins only.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, headers, ...rest } = options
  const response = await fetch(path, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: 'same-origin',
  })

  if (!response.ok) {
    throw new ApiError(response.statusText || 'Request failed', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export const api = {
  appOrigin: env.appUrl,
}
