import { AppError } from '../errors.js'

type PaymentRow = {
  status: string
  gatewayReference: string | null
}

/**
 * Ensures customer checkout verification matches the server-created Razorpay order.
 * Checkout success alone must not mark a payment paid without this binding.
 */
export function assertCustomerPaymentReadyForRazorpayVerify(
  payment: PaymentRow,
  razorpayOrderId: string,
): void {
  if (payment.status === 'succeeded') {
    return
  }

  if (payment.status === 'failed') {
    throw new AppError('CONFLICT', 'This payment could not be completed.', 409)
  }

  if (payment.status !== 'processing') {
    throw new AppError('CONFLICT', 'This payment is not awaiting confirmation.', 409)
  }

  if (!payment.gatewayReference || payment.gatewayReference !== razorpayOrderId) {
    throw new AppError('FORBIDDEN', 'Payment verification failed.', 403)
  }
}
