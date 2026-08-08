-- Phase 9: explicit proposal currency (default INR for existing rows)

ALTER TABLE "proposals" ADD COLUMN IF NOT EXISTS "currency" text NOT NULL DEFAULT 'INR';
