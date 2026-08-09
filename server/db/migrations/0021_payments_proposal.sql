-- Phase 4.9: proposal-linked payments (invoice optional)

ALTER TABLE "payments" ALTER COLUMN "invoice_id" DROP NOT NULL;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "proposal_id" uuid REFERENCES "proposals"("id") ON DELETE SET NULL;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'INR';

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "provider" text NOT NULL DEFAULT 'razorpay';

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "paid_at" timestamptz;

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "signature_verified" boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS "payments_proposal_id_idx" ON "payments" ("proposal_id");
