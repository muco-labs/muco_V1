import { createMiddleware } from 'hono/factory'
import { randomUUID } from 'node:crypto'
import { logInfo } from '../lib/logger.js'

export const requestContext = createMiddleware(async (c, next) => {
  const requestId = c.req.header('x-request-id') ?? randomUUID()
  c.set('requestId', requestId)
  c.header('x-request-id', requestId)

  const started = Date.now()
  await next()
  const durationMs = Date.now() - started

  logInfo('http_request', {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    durationMs,
  })
})
