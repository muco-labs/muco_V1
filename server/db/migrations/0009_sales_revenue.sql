-- Phase 6: sales opportunity fields, proposal pricing, recurring agreement tracking

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "estimated_value" numeric(12, 2);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "expected_close_at" timestamp with time zone;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "sales_next_action" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "referral_source" text;

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "revised_from_id" uuid;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "discount_amount" numeric(12, 2);
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "discount_note" text;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "approved_for_send_at" timestamp with time zone;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "approved_for_send_by" uuid;
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "payment_schedule" text;

DO $$ BEGIN
  ALTER TABLE "proposals" ADD CONSTRAINT "proposals_revised_from_id_proposals_id_fk"
    FOREIGN KEY ("revised_from_id") REFERENCES "public"."proposals"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "proposal_line_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proposal_id" uuid NOT NULL REFERENCES "public"."proposals"("id") ON DELETE CASCADE,
  "description" text NOT NULL,
  "quantity" numeric(10, 2) NOT NULL DEFAULT '1',
  "unit_amount" numeric(12, 2) NOT NULL,
  "item_type" text NOT NULL DEFAULT 'service',
  "sort_order" integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS "proposal_line_items_proposal_id_idx" ON "proposal_line_items" ("proposal_id");

CREATE TABLE IF NOT EXISTS "recurring_agreements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_id" uuid NOT NULL REFERENCES "public"."customer_profiles"("id") ON DELETE CASCADE,
  "project_id" uuid REFERENCES "public"."projects"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "service_category" text,
  "amount" numeric(12, 2) NOT NULL,
  "billing_interval" text NOT NULL DEFAULT 'monthly',
  "status" text NOT NULL DEFAULT 'active',
  "starts_at" timestamp with time zone,
  "renews_at" timestamp with time zone,
  "owner_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "recurring_agreements_customer_id_idx" ON "recurring_agreements" ("customer_id");
CREATE INDEX IF NOT EXISTS "recurring_agreements_renews_at_idx" ON "recurring_agreements" ("renews_at");
