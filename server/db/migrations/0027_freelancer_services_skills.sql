-- Phase 4.18: Freelancer services, skills, and base pricing (internal)

DO $$ BEGIN
  CREATE TYPE "freelancer_pricing_type" AS ENUM (
    'fixed',
    'starting_from',
    'hourly',
    'per_project',
    'custom_quote'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "freelancer_services" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "freelancer_id" uuid NOT NULL REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE,
  "service_slug" text NOT NULL,
  "sub_service_slug" text,
  "description" text,
  "experience_level" text,
  "pricing_type" "freelancer_pricing_type" NOT NULL DEFAULT 'custom_quote',
  "base_price" numeric(12, 2),
  "minimum_price" numeric(12, 2),
  "currency" text NOT NULL DEFAULT 'INR',
  "is_active" boolean NOT NULL DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "freelancer_services_freelancer_id_idx" ON "freelancer_services" ("freelancer_id");
CREATE INDEX IF NOT EXISTS "freelancer_services_service_slug_idx" ON "freelancer_services" ("service_slug");

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_services_unique_general_idx"
  ON "freelancer_services" ("freelancer_id", "service_slug")
  WHERE "sub_service_slug" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_services_unique_sub_idx"
  ON "freelancer_services" ("freelancer_id", "service_slug", "sub_service_slug")
  WHERE "sub_service_slug" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "freelancer_skills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "freelancer_id" uuid NOT NULL REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE,
  "service_slug" text NOT NULL,
  "skill_slug" text NOT NULL,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "freelancer_skills_freelancer_id_idx" ON "freelancer_skills" ("freelancer_id");

CREATE UNIQUE INDEX IF NOT EXISTS "freelancer_skills_unique_idx"
  ON "freelancer_skills" ("freelancer_id", "skill_slug");
