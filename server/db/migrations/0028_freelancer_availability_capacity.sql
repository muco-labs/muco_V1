-- Phase 4.19: Freelancer availability (limited) + availability timestamp

DO $$ BEGIN
  ALTER TYPE "freelancer_availability_status" ADD VALUE 'limited';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "freelancer_profiles"
  ADD COLUMN IF NOT EXISTS "availability_updated_at" timestamp with time zone;
