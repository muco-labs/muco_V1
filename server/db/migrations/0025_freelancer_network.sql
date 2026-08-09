-- Phase 4.16: Freelancer network foundation

DO $$ BEGIN
  CREATE TYPE "freelancer_verification_status" AS ENUM ('pending', 'verified', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "freelancer_approval_status" AS ENUM (
    'under_review',
    'approved',
    'rejected',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "freelancer_availability_status" AS ENUM ('available', 'unavailable');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "freelancer_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "email" text NOT NULL,
  "full_name" text NOT NULL,
  "phone" text,
  "country" text,
  "city" text,
  "professional_role" text NOT NULL,
  "experience_level" text,
  "headline" text,
  "bio" text,
  "skills" text NOT NULL,
  "service_categories" text NOT NULL,
  "portfolio_urls" text,
  "preferred_project_type" text,
  "availability_note" text,
  "open_to_projects" boolean NOT NULL DEFAULT true,
  "verification_status" "freelancer_verification_status" NOT NULL DEFAULT 'pending',
  "approval_status" "freelancer_approval_status" NOT NULL DEFAULT 'under_review',
  "availability_status" "freelancer_availability_status" NOT NULL DEFAULT 'unavailable',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_profiles_email_idx" ON "freelancer_profiles" (lower("email"));
CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_profiles_user_id_idx" ON "freelancer_profiles" ("user_id");
CREATE INDEX IF NOT EXISTS "freelancer_profiles_approval_status_idx" ON "freelancer_profiles" ("approval_status");
CREATE INDEX IF NOT EXISTS "freelancer_profiles_verification_status_idx" ON "freelancer_profiles" ("verification_status");

CREATE TABLE IF NOT EXISTS "freelancer_internal_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "freelancer_id" uuid NOT NULL REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE,
  "author_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "freelancer_internal_notes_freelancer_id_idx"
  ON "freelancer_internal_notes" ("freelancer_id");

INSERT INTO "roles" ("name", "description")
VALUES ('FREELANCER', 'Role: FREELANCER')
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "permissions" ("name", "description")
VALUES
  ('freelancers.view', 'freelancers.view'),
  ('freelancers.manage', 'freelancers.manage'),
  ('freelancers.notes', 'freelancers.notes')
ON CONFLICT ("name") DO NOTHING;
