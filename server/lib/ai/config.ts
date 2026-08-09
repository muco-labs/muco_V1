const trim = (value: string | undefined) => value?.trim() || undefined

export const aiEnv = {
  nvidiaApiKey: trim(process.env.NVIDIA_API_KEY),
  nvidiaBaseUrl: trim(process.env.NVIDIA_API_BASE_URL) ?? 'https://integrate.api.nvidia.com/v1',
  nvidiaModel: trim(process.env.NVIDIA_MODEL) ?? 'meta/llama-3.1-8b-instruct',
  requestTimeoutMs: Number(process.env.NVIDIA_REQUEST_TIMEOUT_MS ?? 30_000),
} as const

export function isNvidiaConfigured(): boolean {
  return Boolean(aiEnv.nvidiaApiKey)
}

export type AiProviderHealth = {
  provider: 'nvidia'
  configured: boolean
  model: string
  note: string
}

export function getNvidiaProviderHealth(): AiProviderHealth {
  return {
    provider: 'nvidia',
    configured: isNvidiaConfigured(),
    model: aiEnv.nvidiaModel,
    note: isNvidiaConfigured()
      ? 'Server-side NVIDIA API key present (not used by public routes until Website/Solution Intelligence features call the provider).'
      : 'Set NVIDIA_API_KEY server-side for future Website Intelligence / Solution Intelligence LLM features.',
  }
}
