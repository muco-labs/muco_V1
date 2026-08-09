/** Customer-safe payment error copy — no secrets or internal codes. */
export function friendlyPaymentError(message: string): string {
  if (/verification failed|forbidden|signature/i.test(message)) {
    return 'We could not verify this payment on our servers. If your bank shows a charge, contact MUCO with your payment reference.'
  }
  if (/not configured|unavailable|503/i.test(message)) {
    return 'Online payments are temporarily unavailable. Please try again later or contact support.'
  }
  if (/already been paid|conflict|409/i.test(message)) {
    return 'This item has already been paid. Refresh the page to see the latest status.'
  }
  if (/cancelled|canceled|dismiss/i.test(message)) {
    return 'Payment was cancelled. You can try again when ready.'
  }
  if (/not payable|expired|validation/i.test(message)) {
    return message.length > 0 && message.length < 200 ? message : 'This payment cannot be completed right now.'
  }
  return message.length > 0 && message.length < 200
    ? message
    : 'Payment could not be completed. Please try again.'
}
