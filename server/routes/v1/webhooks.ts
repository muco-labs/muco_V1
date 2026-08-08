import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { AppError } from '../../lib/errors.js'
import { handleRouteError, jsonSuccess } from '../../lib/response.js'
import { getDb } from '../../db/client.js'
import { payments } from '../../db/schema.js'
import {
  finalizeFailedPayment,
  finalizeSuccessfulPayment,
  findPaymentByRazorpayOrderId,
  verifyRazorpayWebhookSignature,
} from '../../services/payment.service.js'

export const webhookRoutes = new Hono()

webhookRoutes.post('/razorpay', async (c) => {
  try {
    const rawBody = await c.req.text()
    const signature = c.req.header('X-Razorpay-Signature')

    if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
      throw new AppError('FORBIDDEN', 'Invalid webhook signature.', 403)
    }

    const payload = JSON.parse(rawBody) as {
      event?: string
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; status?: string; error_description?: string } }
      }
    }

    const event = payload.event

    if (event !== 'payment.captured' && event !== 'payment.failed') {
      return jsonSuccess(c, { received: true, ignored: true })
    }

    const paymentEntity = payload.payload?.payment?.entity
    const razorpayPaymentId = paymentEntity?.id
    const orderId = paymentEntity?.order_id

    if (!orderId) {
      throw new AppError('VALIDATION_ERROR', 'Incomplete webhook payload.', 400)
    }

    let payment = await findPaymentByRazorpayOrderId(orderId)
    if (!payment) {
      const db = getDb()
      if (db) {
        const [byReceipt] = await db
          .select()
          .from(payments)
          .where(eq(payments.id, orderId))
          .limit(1)
        payment = byReceipt ?? null
      }
    }

    if (!payment) {
      return jsonSuccess(c, { received: true, matched: false })
    }

    if (event === 'payment.failed') {
      const result = await finalizeFailedPayment({
        paymentId: payment.id,
        source: 'webhook',
        reason: paymentEntity?.error_description,
      })
      return jsonSuccess(c, { received: true, ...result })
    }

    if (!razorpayPaymentId) {
      throw new AppError('VALIDATION_ERROR', 'Incomplete webhook payload.', 400)
    }

    const result = await finalizeSuccessfulPayment({
      paymentId: payment.id,
      razorpayPaymentId,
      source: 'webhook',
    })

    return jsonSuccess(c, { received: true, ...result })
  } catch (error) {
    return handleRouteError(c, error)
  }
})
