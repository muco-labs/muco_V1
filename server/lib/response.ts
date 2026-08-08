import type { Context } from 'hono'
import type { ContentfulStatusCode } from 'hono/utils/http-status'
import { AppError, isAppError } from './errors.js'
import { logError } from './logger.js'

export type ApiSuccess<T> = {
  success: true
  data: T
  meta?: Record<string, unknown>
}

export type ApiFailure = {
  success: false
  error: {
    code: string
    message: string
    requestId?: string
    details?: Record<string, string[]>
  }
}

export function jsonSuccess<T>(
  c: Context,
  data: T,
  status: ContentfulStatusCode = 200,
  meta?: Record<string, unknown>,
) {
  const body: ApiSuccess<T> = { success: true, data, ...(meta ? { meta } : {}) }
  return c.json(body, status)
}

export function jsonError(
  c: Context,
  code: string,
  message: string,
  status: ContentfulStatusCode,
  details?: Record<string, string[]>,
) {
  const body: ApiFailure = {
    success: false,
    error: {
      code,
      message,
      requestId: c.get('requestId'),
      ...(details ? { details } : {}),
    },
  }
  return c.json(body, status)
}

export function handleRouteError(c: Context, error: unknown) {
  if (isAppError(error)) {
    if (error.status >= 500) {
      logError('application_error', {
        requestId: c.get('requestId'),
        code: error.code,
        message: error.message,
      })
    }
    return jsonError(
      c,
      error.code,
      error.message,
      error.status as ContentfulStatusCode,
      error.details,
    )
  }

  logError('unexpected_error', {
    requestId: c.get('requestId'),
    message: error instanceof Error ? error.message : 'unknown',
  })

  return jsonError(c, 'INTERNAL_ERROR', 'Something went wrong. Please try again later.', 500)
}

export function assertFound<T>(value: T | null | undefined, message: string): T {
  if (value == null) {
    throw new AppError('NOT_FOUND', message, 404)
  }
  return value
}
