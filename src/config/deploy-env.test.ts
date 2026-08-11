import { describe, expect, it } from 'vitest'
import { isProductionDeploy, resolveBuildDeployEnv, resolveDeployEnv } from './deploy-env'

describe('deploy-env', () => {
  it('prefers explicit DEPLOY_ENV', () => {
    expect(resolveDeployEnv({ deployEnv: 'production', context: 'deploy-preview', vercelEnv: 'preview' })).toBe(
      'production',
    )
  })

  it('maps Netlify CONTEXT', () => {
    expect(resolveDeployEnv({ context: 'production' })).toBe('production')
    expect(resolveDeployEnv({ context: 'deploy-preview' })).toBe('preview')
    expect(resolveDeployEnv({ context: 'branch-deploy' })).toBe('preview')
  })

  it('falls back to legacy VERCEL_ENV', () => {
    expect(resolveDeployEnv({ vercelEnv: 'preview' })).toBe('preview')
  })

  it('isProductionDeploy', () => {
    expect(isProductionDeploy({ deployEnv: 'production' })).toBe(true)
    expect(isProductionDeploy({ context: 'deploy-preview' })).toBe(false)
  })

  it('resolveBuildDeployEnv reads process-like env', () => {
    expect(resolveBuildDeployEnv({ CONTEXT: 'production' })).toBe('production')
    expect(resolveBuildDeployEnv({ DEPLOY_ENV: 'preview', CONTEXT: 'production' })).toBe('preview')
  })
})
