import { Hono } from 'hono'
import { checkDatabaseConnection } from './db/client.js'
import { requestContext } from './middleware/request-context.js'
import { handleRouteError, jsonSuccess } from './lib/response.js'
import { createV1App } from './routes/v1/index.js'

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
    auth: import('./middleware/authenticate.js').AuthContext
    supabaseIdentity: import('./middleware/authenticate.js').SupabaseIdentity
  }
}

export function createApp() {
  const app = new Hono().basePath('/api')

  app.use('*', requestContext)

  app.get('/health', async (c) => {
    try {
      const database = await checkDatabaseConnection()
      return jsonSuccess(c, {
        status: 'ok',
        database,
      })
    } catch (error) {
      return handleRouteError(c, error)
    }
  })

  app.route('/', createV1App())

  app.notFound((c) => c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, 404))

  return app
}

export const app = createApp()
