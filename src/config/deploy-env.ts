/**
 * Host-agnostic deploy context for SEO canonicals and portal origins.
 * Prefers explicit DEPLOY_ENV, then Netlify CONTEXT, then legacy VERCEL_ENV.
 */
export type DeployEnv = 'production' | 'preview' | 'development' | (string & {})

function readNodeProcessEnv(key: string): string | undefined {
  const rawNodeEnv =
    typeof globalThis !== 'undefined' &&
    'process' in globalThis &&
    (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
  const nodeEnv = rawNodeEnv && typeof rawNodeEnv === 'object' ? rawNodeEnv : undefined
  return nodeEnv?.[key]
}

export type ResolveDeployEnvInput = {
  deployEnv?: string | undefined
  /** Netlify build/runtime CONTEXT */
  context?: string | undefined
  /** Legacy Vercel env (compat during cutover) */
  vercelEnv?: string | undefined
}

function mapNetlifyContext(context: string): DeployEnv | undefined {
  if (context === 'production') return 'production'
  if (context === 'deploy-preview' || context === 'branch-deploy') return 'preview'
  if (context === 'dev') return 'development'
  return undefined
}

export function resolveDeployEnv(input: ResolveDeployEnvInput = {}): DeployEnv {
  const explicit = (input.deployEnv ?? readNodeProcessEnv('DEPLOY_ENV'))?.trim()
  if (explicit) return explicit

  const context = (input.context ?? readNodeProcessEnv('CONTEXT'))?.trim()
  if (context) {
    const mapped = mapNetlifyContext(context)
    if (mapped) return mapped
  }

  const vercelEnv = (input.vercelEnv ?? readNodeProcessEnv('VERCEL_ENV'))?.trim()
  if (vercelEnv) return vercelEnv

  return 'development'
}

export function isProductionDeploy(input: ResolveDeployEnvInput = {}): boolean {
  return resolveDeployEnv(input) === 'production'
}

/** Resolve deploy env at Vite build time for import.meta.env injection. */
export function resolveBuildDeployEnv(
  env?: Record<string, string | undefined>,
): string {
  const source =
    env ??
    ({
      DEPLOY_ENV: readNodeProcessEnv('DEPLOY_ENV'),
      CONTEXT: readNodeProcessEnv('CONTEXT'),
      VERCEL_ENV: readNodeProcessEnv('VERCEL_ENV'),
    } satisfies Record<string, string | undefined>)

  return resolveDeployEnv({
    deployEnv: source.DEPLOY_ENV,
    context: source.CONTEXT,
    vercelEnv: source.VERCEL_ENV,
  })
}
