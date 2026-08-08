const brand = 'MUCO LABS'

export const emailTemplates = {
  inquiry_confirmation: {
    subject: 'We received your enquiry',
    body: (v: { name: string }) =>
      `<p>Hi ${escapeHtml(v.name)},</p><p>Thank you for contacting ${brand}. We have received your enquiry and will respond with a practical next step.</p><p>— ${brand}</p>`,
  },
  proposal_sent: {
    subject: 'New proposal from MUCO LABS',
    body: (v: { title: string }) =>
      `<p>A proposal <strong>${escapeHtml(v.title)}</strong> is ready for your review in the customer portal.</p>`,
  },
  invoice_issued: {
    subject: 'Invoice issued',
    body: (v: { invoiceNumber: string }) =>
      `<p>Invoice <strong>${escapeHtml(v.invoiceNumber)}</strong> has been issued. Sign in to your customer portal to view and pay.</p>`,
  },
  payment_confirmation: {
    subject: 'Payment confirmation',
    body: (v: { invoiceNumber: string; amount: string }) =>
      `<p>We received your payment of <strong>₹${escapeHtml(v.amount)}</strong> for invoice ${escapeHtml(v.invoiceNumber)}.</p>`,
  },
  employee_invitation: {
    subject: 'Invitation to MUCO LABS team workspace',
    body: () => `<p>You have been invited to the MUCO LABS team workspace. Use the link in your invitation email to set your password.</p>`,
  },
} as const

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function renderEmail(
  templateId: keyof typeof emailTemplates,
  variables: Record<string, string>,
) {
  const template = emailTemplates[templateId]
  const subject = template.subject
  const body =
    'body' in template && typeof template.body === 'function'
      ? (template.body as (v: Record<string, string>) => string)(variables)
      : ''
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;line-height:1.5">${body}</body></html>`
  return { subject, html }
}
