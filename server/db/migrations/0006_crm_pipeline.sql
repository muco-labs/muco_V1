-- CRM pipeline extensions (Step 12)
ALTER TYPE "lead_status" ADD VALUE IF NOT EXISTS 'discovery';
ALTER TYPE "lead_status" ADD VALUE IF NOT EXISTS 'negotiation';

DO $$ BEGIN
  CREATE TYPE "lead_follow_up_status" AS ENUM('pending', 'due', 'completed', 'missed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "lead_lost_reason" AS ENUM(
    'price',
    'timing',
    'no_response',
    'competitor',
    'not_a_fit',
    'cancelled',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "website" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "priority" "task_priority" NOT NULL DEFAULT 'medium';
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "last_contacted_at" timestamp with time zone;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "follow_up_status" "lead_follow_up_status" DEFAULT 'pending';
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "converted_at" timestamp with time zone;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lost_reason" "lead_lost_reason";
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "customer_id" uuid;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "possible_duplicate_of" uuid;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "qualification_business_type" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "qualification_project_size" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "qualification_urgency" text;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "qualification_decision_maker" text;

DO $$ BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_customer_id_customer_profiles_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "public"."customer_profiles"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "leads" ADD CONSTRAINT "leads_possible_duplicate_of_leads_id_fk"
    FOREIGN KEY ("possible_duplicate_of") REFERENCES "public"."leads"("id") ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "leads_assigned_employee_id_idx" ON "leads" ("assigned_employee_id");
CREATE INDEX IF NOT EXISTS "leads_follow_up_at_idx" ON "leads" ("follow_up_at");
CREATE INDEX IF NOT EXISTS "leads_priority_idx" ON "leads" ("priority");
CREATE INDEX IF NOT EXISTS "leads_customer_id_idx" ON "leads" ("customer_id");

CREATE TABLE IF NOT EXISTS "lead_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "public"."leads"("id") ON DELETE CASCADE,
  "author_user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lead_notes_lead_id_idx" ON "lead_notes" ("lead_id");

CREATE TABLE IF NOT EXISTS "lead_activities" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "public"."leads"("id") ON DELETE CASCADE,
  "actor_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "metadata" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lead_activities_lead_id_idx" ON "lead_activities" ("lead_id");

CREATE TABLE IF NOT EXISTS "lead_interactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id" uuid NOT NULL REFERENCES "public"."leads"("id") ON DELETE CASCADE,
  "logged_by_user_id" uuid REFERENCES "public"."users"("id") ON DELETE SET NULL,
  "interaction_type" text NOT NULL,
  "summary" text NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "next_action" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "lead_interactions_lead_id_idx" ON "lead_interactions" ("lead_id");

ALTER TABLE "lead_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_activities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "lead_interactions" ENABLE ROW LEVEL SECURITY;
