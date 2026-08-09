import { AppError } from '../errors.js'
import { isRazorpayConfigured, serverEnv } from '../env.js'

export type RazorpayOrderResult =
  | {
      configured: true
      orderId: string
      amountPaise: number
      currency: string
      keyId: string
    }
  | { configured: false; message: string }

export async function createRazorpayOrder(input: {
  amount: string
  currency: string
  receipt: string
  notes: Record<string, string>
}): Promise<RazorpayOrderResult> {
  if (!isRazorpayConfigured()) {
    return { configured: false, message: 'Online payments are not configured yet.' }
  }

  const amountPaise = Math.round(Number(input.amount) * 100)
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
    throw new AppError('VALIDATION_ERROR', 'Invalid payment amount.', 400)
  }

  const auth = Buffer.from(`${serverEnv.razorpayKeyId}:${serverEnv.razorpayKeySecret}`).toString(
    'base64',
  )

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    }),
  })

  if (!response.ok) {
    throw new AppError('SERVICE_UNAVAILABLE', 'Could not start payment. Try again later.', 503)
  }

  const order = (await response.json()) as { id: string }

  return {
    configured: true,
    orderId: order.id,
    amountPaise,
    currency: input.currency,
    keyId: serverEnv.razorpayKeyId!,
  }
}
