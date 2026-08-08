-- MUCO Website Intelligence (internal audit engine)

DO $$ BEGIN
  CREATE TYPE "wi_audit_status" AS ENUM ('queued', 'running', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "wi_issue_severity" AS ENUM ('critical', 'high', 'medium', 'low', 'informational');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "wi_issue_status" AS ENUM ('open', 'reviewed', 'resolved', 'ignored');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "wi_opportunity_level" AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS "wi_websites" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "normalized_host" text NOT NULL,
  "company_name" text,
  "country" text,
  "city" text,
  "notes" text,
  "created_by_user_id" uuid REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "wi_websites_normalized_host_idx" ON "wi_websites" ("normalized_host");

CREATE TABLE IF NOT EXISTS "wi_audits" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "website_id" uuid NOT NULL REFERENCES "wi_websites" ("id") ON DELETE CASCADE,
  "target_url" text NOT NULL,
  "normalized_url" text NOT NULL,
  "status" "wi_audit_status" NOT NULL DEFAULT 'queued',
  "progress_phase" text,
  "error_message" text,
  "overall_score" integer,
  "category_scores" text,
  "opportunity_level" "wi_opportunity_level",
  "opportunity_score" integer,
  "created_by_user_id" uuid REFERENCES "users" ("id") ON DELETE SET NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone
);

CREATE INDEX IF NOT EXISTS "wi_audits_website_id_idx" ON "wi_audits" ("website_id");
CREATE INDEX IF NOT EXISTS "wi_audits_status_idx" ON "wi_audits" ("status");
CREATE INDEX IF NOT EXISTS "wi_audits_created_at_idx" ON "wi_audits" ("created_at");

CREATE TABLE IF NOT EXISTS "wi_audit_pages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audit_id" uuid NOT NULL REFERENCES "wi_audits" ("id") ON DELETE CASCADE,
  "url" text NOT NULL,
  "status_code" integer,
  "title" text,
  "meta_description" text,
  "canonical" text,
  "h1_texts" text,
  "headings" text,
  "word_count" integer,
  "internal_links" text,
  "external_links" text,
  "image_count" integer,
  "images_missing_alt" integer,
  "robots_noindex" boolean DEFAULT false,
  "html_lang" text,
  "viewport_meta" boolean DEFAULT false,
  "og_present" boolean DEFAULT false,
  "twitter_card_present" boolean DEFAULT false,
  "structured_data_types" text,
  "content_type" text,
  "response_time_ms" integer,
  "crawled_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "wi_audit_pages_audit_id_idx" ON "wi_audit_pages" ("audit_id");
CREATE UNIQUE INDEX IF NOT EXISTS "wi_audit_pages_audit_url_idx" ON "wi_audit_pages" ("audit_id", "url");

CREATE TABLE IF NOT EXISTS "wi_audit_issues" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audit_id" uuid NOT NULL REFERENCES "wi_audits" ("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "severity" "wi_issue_severity" NOT NULL,
  "status" "wi_issue_status" NOT NULL DEFAULT 'open',
  "title" text NOT NULL,
  "description" text NOT NULL,
  "affected_urls" text,
  "evidence" text,
  "recommendation" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "wi_audit_issues_audit_id_idx" ON "wi_audit_issues" ("audit_id");
CREATE INDEX IF NOT EXISTS "wi_audit_issues_severity_idx" ON "wi_audit_issues" ("severity");

CREATE TABLE IF NOT EXISTS "wi_audit_metrics" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audit_id" uuid NOT NULL REFERENCES "wi_audits" ("id") ON DELETE CASCADE,
  "category" text NOT NULL,
  "metric_key" text NOT NULL,
  "metric_value" text,
  "measured" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "wi_audit_metrics_audit_id_idx" ON "wi_audit_metrics" ("audit_id");

CREATE TABLE IF NOT EXISTS "wi_audit_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "audit_id" uuid NOT NULL REFERENCES "wi_audits" ("id") ON DELETE CASCADE,
  "event" text NOT NULL,
  "detail" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "wi_audit_events_audit_id_idx" ON "wi_audit_events" ("audit_id");
