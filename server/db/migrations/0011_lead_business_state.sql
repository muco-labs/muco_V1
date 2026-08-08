-- Phase 8: voluntary business state/region on leads (no IP inference)

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "business_state" text;

CREATE INDEX IF NOT EXISTS "leads_business_state_idx" ON "leads" ("business_state");
