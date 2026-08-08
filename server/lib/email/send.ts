import { renderEmail } from './templates.js'
import { serverEnv } from '../env.js'

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim())
}

export async function sendTransactionalEmail(
  templateId: keyof typeof import('./templates.js').emailTemplates,
  to: string,
  variables: Record<string, string>,
): Promise<'sent' | 'skipped'> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) return 'skipped'

  const { subject, html } = renderEmail(templateId, variables)
  const from = process.env.RESEND_FROM_EMAIL?.trim() || 'MUCO LABS <noreply@mucolabs.com>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    return 'skipped'
  }

  return 'sent'
}

export function emailConfigurationStatus() {
  return {
    resend: { configured: isEmailConfigured() },
    note: 'Email is optional. When RESEND_API_KEY is not set, notifications remain in-app only.',
    publicSiteUrl: serverEnv.authRedirectUrl ?? null,
  }
}
