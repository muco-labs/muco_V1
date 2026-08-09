export type RazorpaySuccessPayload = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

export type RazorpayCheckoutConfig = {
  configured: boolean
  message?: string
  keyId?: string
  orderId?: string
  amount?: number
  currency?: string
}

function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export async function startRazorpayCheckout(
  razorpay: RazorpayCheckoutConfig | undefined,
  onSuccess: (payload: RazorpaySuccessPayload) => void | Promise<void>,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!razorpay?.configured || !razorpay.keyId || !razorpay.orderId) {
    return {
      ok: false,
      message: razorpay?.message ?? 'Online payments are not configured yet.',
    }
  }

  const loaded = await loadRazorpayScript()
  if (!loaded) {
    return { ok: false, message: 'Could not load the payment checkout. Try again or contact support.' }
  }

  const RazorpayCtor = window.Razorpay
  if (!RazorpayCtor) {
    return { ok: false, message: 'Could not load the payment checkout. Try again or contact support.' }
  }

  return new Promise((resolve) => {
    const instance = new RazorpayCtor({
      key: razorpay.keyId,
      order_id: razorpay.orderId,
      amount: razorpay.amount,
      currency: razorpay.currency,
      handler: async (response: RazorpaySuccessPayload) => {
        try {
          await onSuccess(response)
          resolve({ ok: true })
        } catch {
          resolve({ ok: false, message: 'Payment could not be verified on the server.' })
        }
      },
      modal: {
        ondismiss: () => {
          resolve({ ok: false, message: 'Payment was cancelled. You can try again when ready.' })
        },
      },
    })
    instance.open()
  })
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}
