/** Map server payment status to customer-facing label. */
export function customerPaymentStatusLabel(status: string | null | undefined): string {
  const s = (status ?? '').toLowerCase()
  switch (s) {
    case 'succeeded':
    case 'paid':
      return 'Paid'
    case 'processing':
      return 'Processing'
    case 'pending':
      return 'Ready to pay'
    case 'failed':
      return 'Failed'
    case 'refunded':
      return 'Refunded'
    case 'required':
      return 'Payment required'
    default:
      return s ? s.replace(/_/g, ' ') : 'Unknown'
  }
}
