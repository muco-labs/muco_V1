import { app } from '../server/app.js'

/**
 * Vercel Node serverless expects a Web `fetch` handler (or named HTTP exports).
 * `export default handle(app)` returns a Response that legacy default exports ignore,
 * which caused /api/health to hang until FUNCTION_INVOCATION_TIMEOUT.
 */
export default {
  fetch: app.fetch.bind(app),
}

export const config = {
  runtime: 'nodejs',
}
