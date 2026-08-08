-- Phase 4: structured lead attribution (UTM, landing page, page context)

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "landing_path" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_source" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_medium" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_campaign" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "utm_content" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "referrer_host" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "page_source" text;

CREATE INDEX IF NOT EXISTS "leads_page_source_idx" ON "leads" ("page_source");
CREATE INDEX IF NOT EXISTS "leads_service_interest_idx" ON "leads" ("service_interest");
