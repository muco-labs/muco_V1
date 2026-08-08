-- Admin: optional lead follow-up scheduling
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "follow_up_at" timestamp with time zone;
