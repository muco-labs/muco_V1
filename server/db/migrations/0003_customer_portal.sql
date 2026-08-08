-- Customer portal: proposal detail fields, invoice lines, support replies, profile fields.

ALTER TYPE "public"."proposal_status" ADD VALUE IF NOT EXISTS 'viewed';
--> statement-breakpoint
ALTER TYPE "public"."proposal_status" ADD VALUE IF NOT EXISTS 'changes_requested';
--> statement-breakpoint

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "title" text;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "scope" text;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "deliverables" text;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "timeline" text;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "terms" text;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "customer_decided_at" timestamp with time zone;
--> statement-breakpoint
ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "customer_decision_note" text;
--> statement-breakpoint

ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "job_title" text;
--> statement-breakpoint
ALTER TABLE "customer_profiles" ADD COLUMN IF NOT EXISTS "avatar_storage_key" text;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "invoice_line_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" uuid NOT NULL,
  "description" text NOT NULL,
  "quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
  "unit_amount" numeric(12, 2) NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "invoice_line_items_invoice_id_invoices_id_fk"
    FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "invoice_line_items_invoice_id_idx" ON "invoice_line_items" ("invoice_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "support_ticket_replies" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id" uuid NOT NULL,
  "author_user_id" uuid NOT NULL,
  "body" text NOT NULL,
  "is_staff" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "support_ticket_replies_ticket_id_fk"
    FOREIGN KEY ("ticket_id") REFERENCES "public"."support_tickets"("id") ON DELETE cascade,
  CONSTRAINT "support_ticket_replies_author_user_id_fk"
    FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "support_ticket_replies_ticket_id_idx" ON "support_ticket_replies" ("ticket_id");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "proposal_approvals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "proposal_id" uuid NOT NULL,
  "customer_id" uuid NOT NULL,
  "decision" text NOT NULL,
  "note" text,
  "proposal_status_at_decision" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "proposal_approvals_proposal_id_fk"
    FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade,
  CONSTRAINT "proposal_approvals_customer_id_fk"
    FOREIGN KEY ("customer_id") REFERENCES "public"."customer_profiles"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "proposal_approvals_proposal_id_idx" ON "proposal_approvals" ("proposal_id");
--> statement-breakpoint

ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "category" text DEFAULT 'other';
--> statement-breakpoint

-- RLS: milestones & tasks visible to project customer
ALTER TABLE "milestones" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "tasks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "support_ticket_replies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint

DROP POLICY IF EXISTS milestones_select_customer ON milestones;
CREATE POLICY milestones_select_customer ON milestones
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE customer_id = public.current_customer_profile_id()
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS tasks_select_customer ON tasks;
CREATE POLICY tasks_select_customer ON tasks
  FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE customer_id = public.current_customer_profile_id()
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS support_ticket_replies_select_customer ON support_ticket_replies;
CREATE POLICY support_ticket_replies_select_customer ON support_ticket_replies
  FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE customer_id = public.current_customer_profile_id()
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS support_ticket_replies_insert_customer ON support_ticket_replies;
CREATE POLICY support_ticket_replies_insert_customer ON support_ticket_replies
  FOR INSERT
  WITH CHECK (
    is_staff = false
    AND author_user_id = public.current_app_user_id()
    AND ticket_id IN (
      SELECT id FROM support_tickets WHERE customer_id = public.current_customer_profile_id()
    )
  );
--> statement-breakpoint

DROP POLICY IF EXISTS files_insert_customer ON files;
CREATE POLICY files_insert_customer ON files
  FOR INSERT
  WITH CHECK (
    uploaded_by_user_id = public.current_app_user_id()
    AND customer_id = public.current_customer_profile_id()
  );
--> statement-breakpoint

DROP POLICY IF EXISTS proposals_update_customer_decision ON proposals;
CREATE POLICY proposals_update_customer_decision ON proposals
  FOR UPDATE
  USING (customer_id = public.current_customer_profile_id())
  WITH CHECK (customer_id = public.current_customer_profile_id());
