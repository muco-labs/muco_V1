-- Phase 1.1: audit coverage / confidence metadata

DO $$ BEGIN
  CREATE TYPE "wi_audit_confidence" AS ENUM ('high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE "wi_audits"
  ADD COLUMN IF NOT EXISTS "pages_discovered" integer,
  ADD COLUMN IF NOT EXISTS "pages_crawled" integer,
  ADD COLUMN IF NOT EXISTS "audit_confidence" "wi_audit_confidence",
  ADD COLUMN IF NOT EXISTS "coverage_note" text,
  ADD COLUMN IF NOT EXISTS "crawl_limitations" text;
