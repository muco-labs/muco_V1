import { and, desc, eq, inArray } from 'drizzle-orm'
import { getDb } from '../db/client.js'
import { payments, proposalLineItems, proposals } from '../db/schema.js'
import { AppError } from '../lib/errors.js'
import { formatPaymentReference } from '../lib/payments/payment-reference.js'
import { createRazorpayOrder } from '../lib/payments/razorpay-order.js'
import {
  assertProposalPayable,
  PAYMENT_OPEN_STATUSES,
  resolveProposalPayableTotal,
} from '../lib/payments/proposal-payment.js'
import { formatProjectReference } from '../lib/projects/project-reference.js'
import { formatProposalReference } from '../lib/proposals/proposal-reference.js'
import type { CustomerContext } from './customer.service.js'
import { hasPermission } from '../lib/auth/permissions.js'
import type { AuthContext } from '../middleware/authenticate.js'

export function serializeCustomerPayment(row: typeof payments.$inferSelect, extras?: {
  proposalReference?: string | null
  projectReference?: string | null
}) {
  return {
    reference: formatPaymentReference(row.id),
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    provider: row.provider,
    paidAt: row.paidAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    proposalReference: extras?.proposalReference ?? null,
    projectReference: extras?.projectReference ?? null,
  }
}

export async function getProposalPaymentSummaryForCustomer(
  ctx: CustomerContext,
  proposalId: string,
) {
  const db = getDb()
  if (!db) return null

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.customerId, ctx.customerId)))
    .limit(1)

  if (!proposal || proposal.status !== 'accepted') return null

  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))

  const payable = resolveProposalPayableTotal(proposal, lineItems)
  if (!payable) {
    return {
      paymentRequired: false,
      reason: 'No payable amount on this proposal.',
      payableAmount: null,
      currency: proposal.currency,
      status: null as string | null,
      paymentReference: null as string | null,
      canPay: false,
    }
  }

  const [succeeded] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.proposalId, proposalId),
        eq(payments.customerId, ctx.customerId),
        eq(payments.status, 'succeeded'),
      ),
    )
    .limit(1)

  if (succeeded) {
    return {
      paymentRequired: false,
      payableAmount: payable.amount,
      currency: payable.currency,
      status: 'paid' as const,
      paymentReference: formatPaymentReference(succeeded.id),
      canPay: false,
      paidAt: succeeded.paidAt?.toISOString() ?? succeeded.updatedAt.toISOString(),
    }
  }

  const [open] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.proposalId, proposalId),
        eq(payments.customerId, ctx.customerId),
        inArray(payments.status, [...PAYMENT_OPEN_STATUSES]),
      ),
    )
    .orderBy(desc(payments.createdAt))
    .limit(1)

  const eligibility = assertProposalPayable(proposal, ctx.customerId)

  return {
    paymentRequired: true,
    payableAmount: payable.amount,
    currency: payable.currency,
    status: open?.status ?? ('required' as const),
    paymentReference: open ? formatPaymentReference(open.id) : null,
    canPay: eligibility.ok,
    payBlockedReason: eligibility.ok ? null : eligibility.reason,
    lastFailed: null as boolean | null,
  }
}

export async function createProposalPaymentIntent(ctx: CustomerContext, proposalId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [proposal] = await db
    .select()
    .from(proposals)
    .where(and(eq(proposals.id, proposalId), eq(proposals.customerId, ctx.customerId)))
    .limit(1)

  if (!proposal) throw new AppError('NOT_FOUND', 'Proposal not found.', 404)

  const eligibility = assertProposalPayable(proposal, ctx.customerId)
  if (!eligibility.ok) {
    throw new AppError('VALIDATION_ERROR', eligibility.reason, 400)
  }

  const lineItems = await db
    .select()
    .from(proposalLineItems)
    .where(eq(proposalLineItems.proposalId, proposalId))

  const payable = resolveProposalPayableTotal(proposal, lineItems)
  if (!payable) {
    throw new AppError('VALIDATION_ERROR', 'This proposal has no payable amount.', 400)
  }

  const [existingPaid] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.proposalId, proposalId),
        eq(payments.status, 'succeeded'),
      ),
    )
    .limit(1)

  if (existingPaid) {
    throw new AppError('CONFLICT', 'This proposal has already been paid.', 409)
  }

  const [open] = await db
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.proposalId, proposalId),
        eq(payments.customerId, ctx.customerId),
        inArray(payments.status, [...PAYMENT_OPEN_STATUSES]),
      ),
    )
    .orderBy(desc(payments.createdAt))
    .limit(1)

  let payment = open
  if (!payment || payment.amount !== payable.amount || payment.currency !== payable.currency) {
    if (payment && payment.amount !== payable.amount) {
      await db
        .update(payments)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(payments.id, payment.id))
    }

    const [inserted] = await db
      .insert(payments)
      .values({
        proposalId: proposal.id,
        customerId: ctx.customerId,
        amount: payable.amount,
        currency: payable.currency,
        provider: 'razorpay',
        status: 'pending',
      })
      .returning()
    payment = inserted
  }

  const order = await createRazorpayOrder({
    amount: payable.amount,
    currency: payable.currency,
    receipt: payment.id,
    notes: {
      proposalId: proposal.id,
      customerId: ctx.customerId,
      paymentId: payment.id,
    },
  })

  if (!order.configured) {
    return {
      payment: serializeCustomerPayment(payment, {
        proposalReference: formatProposalReference(proposal.id),
        projectReference: proposal.projectId
          ? formatProjectReference(proposal.projectId)
          : null,
      }),
      razorpay: order,
    }
  }

  await db
    .update(payments)
    .set({
      gatewayReference: order.orderId,
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id))

  return {
    payment: serializeCustomerPayment(
      { ...payment, status: 'processing', gatewayReference: order.orderId },
      {
        proposalReference: formatProposalReference(proposal.id),
        projectReference: proposal.projectId
          ? formatProjectReference(proposal.projectId)
          : null,
      },
    ),
    razorpay: {
      configured: true as const,
      keyId: order.keyId,
      orderId: order.orderId,
      amount: order.amountPaise,
      currency: order.currency,
    },
    paymentId: payment.id,
  }
}

export async function getCustomerPaymentDetail(ctx: CustomerContext, paymentId: string) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [payment] = await db
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.customerId, ctx.customerId)))
    .limit(1)

  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found.', 404)

  let proposalReference: string | null = null
  let projectReference: string | null = null
  if (payment.proposalId) {
    const [proposal] = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, payment.proposalId))
      .limit(1)
    if (proposal) {
      proposalReference = formatProposalReference(proposal.id)
      if (proposal.projectId) projectReference = formatProjectReference(proposal.projectId)
    }
  }

  return {
    id: payment.id,
    ...serializeCustomerPayment(payment, { proposalReference, projectReference }),
  }
}

export async function listCustomerPaymentsEnriched(ctx: CustomerContext) {
  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const rows = await db
    .select()
    .from(payments)
    .where(eq(payments.customerId, ctx.customerId))
    .orderBy(desc(payments.createdAt))

  const result = []
  for (const row of rows) {
    let proposalReference: string | null = null
    let projectReference: string | null = null
    if (row.proposalId) {
      const [proposal] = await db
        .select()
        .from(proposals)
        .where(eq(proposals.id, row.proposalId))
        .limit(1)
      if (proposal) {
        proposalReference = formatProposalReference(proposal.id)
        if (proposal.projectId) projectReference = formatProjectReference(proposal.projectId)
      }
    }
    result.push({
      id: row.id,
      ...serializeCustomerPayment(row, { proposalReference, projectReference }),
    })
  }
  return result
}

export async function getPaymentFulfillmentAdmin(auth: AuthContext, paymentId: string) {
  if (!hasPermission(auth.permissions, 'payments.view')) {
    throw new AppError('FORBIDDEN', 'You do not have permission to view payments.', 403)
  }

  const db = getDb()
  if (!db) throw new AppError('SERVICE_UNAVAILABLE', 'Service unavailable.', 503)

  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1)
  if (!payment) throw new AppError('NOT_FOUND', 'Payment not found.', 404)

  let proposal = null
  if (payment.proposalId) {
    const [row] = await db.select().from(proposals).where(eq(proposals.id, payment.proposalId)).limit(1)
    if (row) {
      proposal = {
        id: row.id,
        reference: formatProposalReference(row.id),
        title: row.title,
        projectId: row.projectId,
        projectReference: row.projectId ? formatProjectReference(row.projectId) : null,
      }
    }
  }

  return {
    payment: {
      ...payment,
      reference: formatPaymentReference(payment.id),
      paidAt: payment.paidAt?.toISOString() ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    },
    proposal,
  }
}
