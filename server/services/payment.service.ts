import { createHmac, timingSafeEqual } from 'node:crypto'
import { and, eq, inArray, lt, sql, sum } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import {
  auditLogs,
  customerProfiles,
  invoices,
  notifications,
  payments,
  proposals,
  roles,
  userRoles,
  users,
} from '../db/schema.js'
import { formatPaymentReference } from '../lib/payments/payment-reference.js'
import { formatProposalReference } from '../lib/proposals/proposal-reference.js'
import { AppError } from '../lib/errors.js'
import { sendTransactionalEmail } from '../lib/email/send.js'
import { isRazorpayConfigured, serverEnv } from '../lib/env.js'

export type FinalizePaymentInput = {
  paymentId: string
  razorpayPaymentId: string
  actorUserId?: string | null
  source: 'customer_verify' | 'webhook'
}

export async function finalizeSuccessfulPayment(input: FinalizePaymentInput) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const result = await db.transaction(async (tx) => {
    const [existingByGateway] = await tx
      .select()
      .from(payments)
      .where(
        and(eq(payments.gatewayReference, input.razorpayPaymentId), eq(payments.status, 'succeeded')),
      )
      .limit(1)

    if (existingByGateway) {
      return {
        status: 'succeeded' as const,
        paymentId: existingByGateway.id,
        duplicate: true,
        invoiceNumber: null as string | null,
        customerUserId: null as string | null,
        customerEmail: null as string | null,
        amount: existingByGateway.amount,
      }
    }

    const [payment] = await tx.select().from(payments).where(eq(payments.id, input.paymentId)).limit(1)
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found.', 404)

    if (payment.status === 'succeeded') {
      return {
        status: 'succeeded' as const,
        paymentId: payment.id,
        duplicate: true,
        invoiceNumber: null,
        customerUserId: null,
        customerEmail: null,
        amount: payment.amount,
      }
    }

    const now = new Date()
    await tx
      .update(payments)
      .set({
        status: 'succeeded',
        gatewayReference: input.razorpayPaymentId,
        signatureVerified: true,
        paidAt: now,
        updatedAt: now,
      })
      .where(eq(payments.id, payment.id))

    let invoiceNumber: string | null = null
    let proposalReference: string | null = null

    if (payment.invoiceId) {
      const paidTotal = await tx
        .select({ total: sum(payments.amount) })
        .from(payments)
        .where(and(eq(payments.invoiceId, payment.invoiceId), eq(payments.status, 'succeeded')))

      const [invoice] = await tx
        .select()
        .from(invoices)
        .where(eq(invoices.id, payment.invoiceId))
        .limit(1)
      if (!invoice) throw new AppError('NOT_FOUND', 'Invoice not found.', 404)

      const paid = Number(paidTotal[0]?.total ?? 0)
      const due = Number(invoice.amount)
      const nextStatus = paid >= due ? 'paid' : 'partial'

      await tx
        .update(invoices)
        .set({ status: nextStatus, updatedAt: now })
        .where(eq(invoices.id, payment.invoiceId))

      invoiceNumber = invoice.invoiceNumber
    } else if (payment.proposalId) {
      const [proposal] = await tx
        .select()
        .from(proposals)
        .where(eq(proposals.id, payment.proposalId))
        .limit(1)
      proposalReference = proposal ? formatProposalReference(proposal.id) : null
    }

    await tx.insert(auditLogs).values({
      actorUserId: input.actorUserId ?? null,
      action: 'payment.verified',
      entity: 'payments',
      entityId: payment.id,
      metadata: JSON.stringify({
        source: input.source,
        proposalId: payment.proposalId,
        invoiceId: payment.invoiceId,
      }),
    })

    const [customerRow] = await tx
      .select({ userId: customerProfiles.userId, email: users.email })
      .from(customerProfiles)
      .innerJoin(users, eq(customerProfiles.userId, users.id))
      .where(eq(customerProfiles.id, payment.customerId))
      .limit(1)

    const adminUsers = await tx
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(roles.name, ['FOUNDER', 'ADMIN', 'SUPER_ADMIN']))

    const uniqueAdmins = [...new Set(adminUsers.map((r) => r.userId))]
    const payRef = formatPaymentReference(payment.id)
    const adminMessage = invoiceNumber
      ? `Payment ${payRef} received for invoice ${invoiceNumber}.`
      : proposalReference
        ? `Payment ${payRef} received for proposal ${proposalReference}.`
        : `Payment ${payRef} received.`

    if (uniqueAdmins.length > 0) {
      await tx.insert(notifications).values(
        uniqueAdmins.map((userId) => ({
          userId,
          type: 'payment.received',
          title: 'Payment received',
          message: adminMessage,
        })),
      )
    }

    if (customerRow?.userId) {
      const customerMessage = invoiceNumber
        ? `Your payment for invoice ${invoiceNumber} was confirmed.`
        : proposalReference
          ? `Your payment for proposal ${proposalReference} was confirmed.`
          : 'Your payment was confirmed.'
      await tx.insert(notifications).values({
        userId: customerRow.userId,
        type: 'payment.received',
        title: 'Payment received',
        message: customerMessage,
      })
    }

    return {
      status: 'succeeded' as const,
      paymentId: payment.id,
      duplicate: false,
      invoiceNumber,
      customerUserId: customerRow?.userId ?? null,
      customerEmail: customerRow?.email ?? null,
      amount: payment.amount,
    }
  })

  if (!result.duplicate && result.customerEmail && result.invoiceNumber) {
    await sendTransactionalEmail('payment_confirmation', result.customerEmail, {
      invoiceNumber: result.invoiceNumber,
      amount: String(result.amount),
    })
  }

  return { status: result.status, paymentId: result.paymentId, duplicate: result.duplicate }
}

export async function finalizeFailedPayment(input: {
  paymentId: string
  actorUserId?: string | null
  source: 'webhook'
  reason?: string
}) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  return db.transaction(async (tx) => {
    const [payment] = await tx.select().from(payments).where(eq(payments.id, input.paymentId)).limit(1)
    if (!payment) throw new AppError('NOT_FOUND', 'Payment not found.', 404)

    if (payment.status === 'succeeded') {
      return { status: 'succeeded' as const, paymentId: payment.id, ignored: true }
    }
    if (payment.status === 'failed') {
      return { status: 'failed' as const, paymentId: payment.id, duplicate: true }
    }

    await tx
      .update(payments)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(payments.id, payment.id))

    await tx.insert(auditLogs).values({
      actorUserId: input.actorUserId ?? null,
      action: 'payment.failed',
      entity: 'payments',
      entityId: payment.id,
      metadata: JSON.stringify({ source: input.source, reason: input.reason ?? null }),
    })

    const [invoice] = payment.invoiceId
      ? await tx.select().from(invoices).where(eq(invoices.id, payment.invoiceId)).limit(1)
      : [null]

    const payRef = formatPaymentReference(payment.id)

    const [customerRow] = await tx
      .select({ userId: customerProfiles.userId })
      .from(customerProfiles)
      .where(eq(customerProfiles.id, payment.customerId))
      .limit(1)

    const adminUsers = await tx
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(roles.name, ['FOUNDER', 'ADMIN', 'SUPER_ADMIN']))

    const uniqueAdmins = [...new Set(adminUsers.map((r) => r.userId))]
    if (uniqueAdmins.length > 0) {
      await tx.insert(notifications).values(
        uniqueAdmins.map((userId) => ({
          userId,
          type: 'payment.failed',
          title: 'Payment failed',
          message: invoice
            ? `Payment failed for invoice ${invoice.invoiceNumber}.`
            : `Payment ${payRef} could not be completed.`,
        })),
      )
    }

    if (customerRow?.userId) {
      await tx.insert(notifications).values({
        userId: customerRow.userId,
        type: 'payment.failed',
        title: 'Payment failed',
        message: invoice
          ? `Your payment for invoice ${invoice.invoiceNumber} could not be completed.`
          : `Your payment ${payRef} could not be completed. You can try again from your proposal.`,
      })
    }

    return { status: 'failed' as const, paymentId: payment.id, duplicate: false }
  })
}

export function verifyRazorpayCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  if (!isRazorpayConfigured()) return false
  const payload = `${orderId}|${paymentId}`
  const expected = createHmac('sha256', serverEnv.razorpayKeySecret!)
    .update(payload)
    .digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export function verifyRazorpayWebhookSignature(body: string, signature: string | undefined): boolean {
  if (!serverEnv.razorpayWebhookSecret || !signature) return false
  const expected = createHmac('sha256', serverEnv.razorpayWebhookSecret).update(body).digest('hex')
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}

export async function findPaymentByRazorpayOrderId(orderId: string) {
  const db = getDb()
  if (!db) return null
  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.gatewayReference, orderId))
    .limit(1)
  return row ?? null
}

export async function syncOverdueInvoices() {
  const db = getDb()
  if (!db) return { updated: 0 }
  const now = new Date()
  const result = await db
    .update(invoices)
    .set({ status: 'overdue', updatedAt: now })
    .where(
      and(
        inArray(invoices.status, ['sent', 'partial']),
        lt(invoices.dueDate, now),
        sql`${invoices.dueDate} IS NOT NULL`,
      ),
    )
    .returning({ id: invoices.id })
  return { updated: result.length }
}
