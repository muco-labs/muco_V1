import { z } from 'zod'
import { aiEnv, isNvidiaConfigured } from './config.js'

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z.string().min(1).max(12_000),
})

const chatResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string(),
        }),
      }),
    )
    .min(1),
})

export type NvidiaChatMessage = z.infer<typeof chatMessageSchema>

export type NvidiaChatResult =
  | { ok: true; content: string }
  | { ok: false; code: 'not_configured' | 'timeout' | 'invalid_response' | 'provider_error'; message: string }

/**
 * Minimal NVIDIA NIM / integrate API chat completion (server-only).
 * Used as foundation for Website Intelligence and Solution Intelligence — not exposed to browsers.
 */
export async function nvidiaChatCompletion(
  messages: NvidiaChatMessage[],
  options?: { maxTokens?: number },
): Promise<NvidiaChatResult> {
  if (!isNvidiaConfigured()) {
    return { ok: false, code: 'not_configured', message: 'NVIDIA API is not configured.' }
  }

  const parsedMessages = z.array(chatMessageSchema).min(1).max(20).safeParse(messages)
  if (!parsedMessages.success) {
    return { ok: false, code: 'invalid_response', message: 'Invalid message payload.' }
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), aiEnv.requestTimeoutMs)

  try {
    const response = await fetch(`${aiEnv.nvidiaBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${aiEnv.nvidiaApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: aiEnv.nvidiaModel,
        messages: parsedMessages.data,
        max_tokens: options?.maxTokens ?? 1024,
        temperature: 0.2,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      return {
        ok: false,
        code: 'provider_error',
        message: `NVIDIA API returned ${response.status}.`,
      }
    }

    const json: unknown = await response.json()
    const parsed = chatResponseSchema.safeParse(json)
    if (!parsed.success) {
      return { ok: false, code: 'invalid_response', message: 'Unexpected NVIDIA response shape.' }
    }

    const content = parsed.data.choices[0]?.message.content?.trim() ?? ''
    if (!content) {
      return { ok: false, code: 'invalid_response', message: 'Empty model response.' }
    }

    return { ok: true, content }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, code: 'timeout', message: 'NVIDIA API request timed out.' }
    }
    return { ok: false, code: 'provider_error', message: 'NVIDIA API request failed.' }
  } finally {
    clearTimeout(timeout)
  }
}
