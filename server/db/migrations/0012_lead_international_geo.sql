-- Phase 9: voluntary international geo (no IP inference)

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "business_country" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "contact_timezone" text;

CREATE INDEX IF NOT EXISTS "leads_business_country_idx" ON "leads" ("business_country");
