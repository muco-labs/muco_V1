-- Step 13: business workflow relationships and operational fields

ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "lead_id" uuid;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "proposal_id" uuid;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "service" text;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "operational_phase" text NOT NULL DEFAULT 'discovery';

DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_lead_id_leads_id_fk"
    FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "projects" ADD CONSTRAINT "projects_proposal_id_proposals_id_fk"
    FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "proposal_id" uuid;

DO $$ BEGIN
  ALTER TABLE "invoices" ADD CONSTRAINT "invoices_proposal_id_proposals_id_fk"
    FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "description" text;
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "sort_order" integer NOT NULL DEFAULT 0;
ALTER TABLE "milestones" ADD COLUMN IF NOT EXISTS "completed_at" timestamp with time zone;

ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "visibility" text NOT NULL DEFAULT 'internal';

CREATE UNIQUE INDEX IF NOT EXISTS "payments_gateway_reference_unique_idx"
  ON "payments" ("gateway_reference")
  WHERE "gateway_reference" IS NOT NULL AND "status" = 'succeeded';

CREATE INDEX IF NOT EXISTS "projects_proposal_id_idx" ON "projects" ("proposal_id");
CREATE INDEX IF NOT EXISTS "projects_lead_id_idx" ON "projects" ("lead_id");
CREATE INDEX IF NOT EXISTS "invoices_proposal_id_idx" ON "invoices" ("proposal_id");
