# Phase 4.37 — Proposals, payments, billing & commercial (MASTER 11)

## 1. Executive summary

MASTER 11 **audited** the existing MUCO commercial lifecycle (lead → customer → proposal → decision → Razorpay → verify/webhook → payment record → project/delivery) and **hardened** customer payment UX and messaging so success is tied to **server verification**, not checkout UI alone. No duplicate payment stack was introduced.

**Status: MASTER 11 — READY WITH LIMITATIONS**

Live Razorpay sandbox payment, authenticated IDOR runs, and full migration repair on the operator Supabase project remain **BLOCKED** without credentials and stable migration journal.

---

## 2. Commercial architecture

| Stage | Primary code |
|-------|----------------|
| Proposals | `proposals`, `proposal_line_items`, `proposal-fulfillment.service.ts` |
| Customer decisions | `customer.service.ts` → `decideProposal` |
| Payable amount | `computeProposalPricing` / `resolveProposalPayableTotal` |
| Razorpay orders | `razorpay-order.ts` → `createRazorpayOrder` |
| Payment records | `payments` table, `proposal-payment.service.ts`, `customer.service.ts` (invoices) |
| Verify (client callback) | `verifyRazorpayPayment` + `verifyRazorpayCheckoutSignature` |
| Webhook | `server/routes/v1/webhooks.ts` → `finalizeSuccessfulPayment` / `finalizeFailedPayment` |
| Project activation | `workflow.service.ts`, `proposal-fulfillment.service.ts`, `project-fulfillment.service.ts` (post-payment flows) |
| Admin commercial | `AdminPortalPages.tsx`, `admin.service.ts`, CRM/sales routes |

---

## 3. Data model (actual)

- **proposals** — `customer_id`, optional `lead_id`, `project_id`, `status` (`proposal_status` enum), `amount`, `discount_amount`, `currency`, line items, `valid_until`.
- **payments** — `customer_id`, optional `proposal_id` / `invoice_id`, `amount`, `currency`, `status` (`payment_status`), `gateway_reference` (Razorpay order id until paid, then payment id on success path per finalize logic), `signature_verified`, `paid_at`.
- **invoices** — `customer_id`, `amount`, `status` (`invoice_status`), optional `proposal_id` / `project_id`; **no currency column** (INR assumed in invoice payment intent today).
- **proposal_decisions** — audit of customer approve/reject/changes.

Ownership is always enforced via `customer_id` on proposals/payments/invoices in customer APIs.

---

## 4. Proposal lifecycle (repository truth)

Statuses: `draft`, `sent`, `viewed`, `changes_requested`, `accepted`, `declined`, `expired`, `cancelled`.

Customer actions (server): `isProposalCustomerActionable` — only `sent` / `viewed` / `changes_requested` and not past `valid_until`.

Presentation: `presentCustomerProposalStatus` + **payment-aware** `nextAction` override in `getCustomerProposal` when `canPay` or `paid`.

Admin transitions: `proposal-fulfillment.service.ts` (send, update, cancel, etc.) with permissions `proposals.*`.

---

## 5. Customer proposal UX

- List/detail: scope, deliverables, timeline, terms, line-item breakdown, validity, status labels.
- Accept / request changes / decline with confirmation.
- Payment section when `accepted` and `getProposalPaymentSummaryForCustomer` returns data.
- **MASTER 11:** shared `runCustomerPaymentCheckout` — user sees confirmation only after server verify; status labels via `customerPaymentStatusLabel`.

---

## 6. Admin proposal UX

Existing admin proposal CRUD/send, CRM linkage, fulfillment hooks — unchanged architecture. Dashboard/sales metrics from DB aggregates (not fabricated).

---

## 7. Money calculation audit

**Authority:** `server/lib/proposals/proposal-pricing.ts` — `computeProposalPricing`, 2-decimal `roundMoney`, discount capped by subtotal.

**Proposal pay:** `resolveProposalPayableTotal` uses line items + discount server-side; `createProposalPaymentIntent` recreates payment row if amount/currency drift.

**Invoice pay:** amount from `invoices.amount` on server at intent creation (not from client).

Client may display totals from API responses only.

---

## 8. Razorpay order lifecycle

1. Server validates ownership + payable state.
2. Inserts/updates `payments` row (`pending` → `processing`).
3. `createRazorpayOrder` (server Basic auth with key secret) → order id + paise.
4. Returns **public** `keyId`, `orderId`, `amount`, `currency` to browser.
5. Checkout.js opens modal; on success, client calls verify endpoint with ids + signature.

---

## 9. Payment verification

`verifyRazorpayPayment`:

- Requires configured Razorpay.
- HMAC signature `order_id|payment_id` with **server secret**.
- Loads payment by `paymentId` **and** `customerId` from auth context.
- `assertCustomerPaymentReadyForRazorpayVerify` — status open + `gatewayReference` matches order id.
- `finalizeSuccessfulPayment` — transactional update, invoice partial/paid, notifications, audit `payment.verified`.

---

## 10. Webhook

`POST /api/v1/webhooks/razorpay`:

- `verifyRazorpayWebhookSignature` (HMAC body + webhook secret).
- Handles `payment.captured` / `payment.failed`; ignores other events.
- Resolves payment by `gateway_reference` = order id.
- Same finalize helpers → **idempotent** duplicate success (by gateway payment id / already succeeded).

---

## 11. Payment state machine

`payment_status`: `pending`, `processing`, `succeeded`, `failed`, `refunded`.

`canTransitionPaymentStatus` in `proposal-payment.ts` documents allowed edges (tests). Finalize paths enforce practical transitions.

---

## 12. Idempotency

- `finalizeSuccessfulPayment`: early return if same Razorpay payment id already succeeded, or row already `succeeded`.
- Webhook safe to retry (signature + state checks).
- `createProposalPaymentIntent`: blocks second success; invalidates open payment if proposal amount changes.

---

## 13. Access control

- Customer routes: `customerId` from `CustomerContext`, never from body.
- Admin payments: `payments.view` / manage permissions.
- Employee/freelancer: no general payment APIs in customer commercial paths.

Tests: `payment-access.test.ts`, `proposal-payment.test.ts`, `payment-verify-eligibility.test.ts`, RBAC in role permissions.

---

## 14. Invoice audit

**Implemented:** invoices, line items, customer list/detail, pay intent, partial/paid via summed succeeded payments.

**Gap:** invoice currency hardcoded `INR` in `createInvoicePaymentIntent` — proposals use `proposal.currency`.

---

## 15. Customer payment UX (MASTER 11)

- `src/lib/commercial/customer-payment-checkout.ts`
- `friendlyPaymentError`, `formatCommercialMoney`, `customerPaymentStatusLabel`
- No success copy before server verify completes.

---

## 16. Failure handling

Razorpay dismiss → cancel message. Verify failure → safe copy. Webhook `payment.failed` → `finalizeFailedPayment` + notifications. Service unavailable when Razorpay env missing.

---

## 17. Admin payment UX

Payments list/detail show provider, status, references — no secrets. Integrations page shows configured flags only.

---

## 18. Refund / cancellation

`refunded` exists on `payment_status` enum and transition map; **no Razorpay refund API or admin refund UI found** → **NOT IMPLEMENTED** (document only).

Proposal `cancelled` / customer `declined` supported; payment refund workflow not built.

---

## 19. Financial audit trail

`audit_logs`: e.g. `payment.verified`, `payment.failed`, proposal send/accept events in fulfillment services. Metadata operational IDs only; `safe-audit-metadata` pattern from MASTER 10 applies.

---

## 20–21. UI / responsive QA

**BLOCKED** without live sessions. Changes are copy/flow only; existing portal layout.

---

## 22. Accessibility

Payment status uses text labels (`customerPaymentStatusLabel`, `role="status"`, `aria-live` on pay messages).

---

## 23–24. Security / IDOR

Source-audited ownership on all customer payment/proposal paths. **Live IDOR:** BLOCKED (MASTER 04.1).

---

## 25. Razorpay secret audit

- Secrets: `server/lib/env.ts` — `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` server-only.
- Client: `src/config/env.ts` documents no secrets in `VITE_*`.
- **Test:** `server/lib/commercial/client-bundle-secrets.test.ts` guards client sources.

Public `keyId` only returned in checkout config from server.

---

## 26. Migration integrity

Operator DB reported **partial migration state** (e.g. enum already exists when re-running migrations). MASTER 11 did **not** reset or drop schema. Commercial tables live in migrations `0000`, `0009`, `0021`, etc. Journal mismatch must be resolved operationally (additive fixes only).

---

## 27. Tests

```
npx vitest run --pool=threads --maxWorkers=2
→ 416 passed, 2 skipped (78 files)
```

Added: commercial client secret guard, `payment-errors.test.ts`, proposal ownership test.

---

## 28–29. Lint / build

`npm run lint` → 0 warnings · `npm run build` → PASS (after TS fixes).

---

## 30–31. Browser / sandbox QA

| Item | Result |
|------|--------|
| Customer proposal → pay UI | **BLOCKED** (auth) |
| Razorpay sandbox real charge | **BLOCKED** (no sandbox keys in repo) |

---

## 32. Blocked items

- Live Razorpay sandbox payment proof.
- Authenticated cross-customer IDOR tests.
- Migration journal repair on Supabase.
- Refund automation.

---

## 33. Remaining limitations

- Invoice currency assumption (INR).
- Project activation may depend on workflow steps beyond payment alone — follow `workflow.service` / fulfillment for exact gates.
- Freelancer portal has no commercial/payment surfaces.

---

## 34. Production readiness

**READY WITH LIMITATIONS** — server-side money and verification architecture is sound; production requires Razorpay env, webhook URL, migration alignment, and live payment smoke test.

---

## Files changed (MASTER 11)

- `server/services/customer.service.ts` — payment-aware `nextAction`
- `src/lib/commercial/*` — checkout helper, errors, money format, status labels
- `src/pages/portal/customer/CustomerPortalPages.tsx` — unified checkout flow
- `server/lib/commercial/client-bundle-secrets.test.ts`
- `server/lib/payments/proposal-payment.test.ts`
- This report
