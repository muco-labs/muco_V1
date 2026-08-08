-- Phase 7: voluntary business location on leads (no IP geo inference)

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "business_city" text;

CREATE INDEX IF NOT EXISTS "leads_business_city_idx" ON "leads" ("business_city");
