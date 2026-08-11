import type { Config } from '@netlify/functions'
import { handle } from 'hono/netlify'
import { app } from '../../server/app.js'

/**
 * Netlify Functions 2.0 entry for the Hono API.
 * `path: /api/*` keeps request URLs aligned with Hono `basePath('/api')`.
 */
export default handle(app)

export const config: Config = {
  path: '/api/*',
}
