import { ApiError } from '@/services/api'
import {
  startRazorpayCheckout,
  type RazorpayCheckoutConfig,
  type RazorpaySuccessPayload,
} from '@/lib/payments/razorpay-checkout'
import { friendlyPaymentError } from '@/lib/commercial/payment-errors'

export type PaymentVerifyPayload = {
  razorpayOrderId: string
  razorpayPaymentId: string
  razorpaySignature: string
}

/**
 * Starts Razorpay checkout only after server-created order intent.
 * Success copy is returned only after server verify succeeds.
 */
export async function runCustomerPaymentCheckout(input: {
  startIntent: () => Promise<{ paymentId?: string; razorpay?: RazorpayCheckoutConfig }>
  verifyOnServer: (paymentId: string, payload: PaymentVerifyPayload) => Promise<void>
  onAfterVerify?: () => void | Promise<void>
}): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  try {
    const intent = await input.startIntent()
    const paymentId = String(intent.paymentId ?? '')
    if (!paymentId) {
      return { ok: false, message: friendlyPaymentError('Payment could not be started.') }
    }

    const checkout = await startRazorpayCheckout(intent.razorpay, async (payload: RazorpaySuccessPayload) => {
      await input.verifyOnServer(paymentId, {
        razorpayOrderId: payload.razorpay_order_id,
        razorpayPaymentId: payload.razorpay_payment_id,
        razorpaySignature: payload.razorpay_signature,
      })
      await input.onAfterVerify?.()
    })

    if (!checkout.ok) {
      return { ok: false, message: friendlyPaymentError(checkout.message) }
    }

    return {
      ok: true,
      message: 'Payment confirmed. Your account will show the updated status shortly.',
    }
  } catch (err) {
    const raw = err instanceof ApiError ? err.message : 'Payment could not be completed.'
    return { ok: false, message: friendlyPaymentError(raw) }
  }
}
