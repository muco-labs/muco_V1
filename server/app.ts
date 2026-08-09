import { Hono } from 'hono'
import { checkDatabaseConnection } from './db/client.js'
import { requestContext } from './middleware/request-context.js'
import { handleRouteError, jsonSuccess } from './lib/response.js'

declare module 'hono' {
  interface ContextVariableMap {
    requestId: string
    auth: import('./middleware/authenticate.js').AuthContext
    supabaseIdentity: import('./middleware/authenticate.js').SupabaseIdentity
  }
}

let v1AppPromise: Promise<Hono> | null = null

function loadV1App(): Promise<Hono> {
  if (!v1AppPromise) {
    v1AppPromise = import('./routes/v1/index.js').then((mod) => mod.createV1App())
  }
  return v1AppPromise
}

export function createApp() {
  const app = new Hono().basePath('/api')

  app.use('*', requestContext)

  app.get('/health', async (c) => {
    try {
      const database = await checkDatabaseConnection()
      const body = {
        status: database === 'unavailable' ? 'degraded' : 'ok',
        database,
      }
      if (database === 'unavailable') {
        return jsonSuccess(c, body, 503)
      }
      return jsonSuccess(c, body)
    } catch (error) {
      return handleRouteError(c, error)
    }
  })

  app.all('*', async (c) => {
    const v1 = await loadV1App()
    return v1.fetch(c.req.raw)
  })

  app.notFound((c) => c.json({ success: false, error: { code: 'NOT_FOUND', message: 'Not found' } }, 404))

  return app
}

export const app = createApp()
