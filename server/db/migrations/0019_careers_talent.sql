-- Phase 4.5: Careers & talent acquisition (separate from sales CRM leads)

CREATE TYPE "public"."career_job_status" AS ENUM('draft', 'published', 'closed');
CREATE TYPE "public"."career_employment_type" AS ENUM('full_time', 'part_time', 'internship', 'contract');
CREATE TYPE "public"."career_application_type" AS ENUM(
  'full_time',
  'part_time',
  'internship',
  'contract',
  'general'
);
CREATE TYPE "public"."career_application_status" AS ENUM(
  'new',
  'reviewing',
  'shortlisted',
  'interview',
  'selected',
  'rejected',
  'archived'
);

CREATE TABLE IF NOT EXISTS "career_job_openings" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "department" text NOT NULL,
  "employment_type" "career_employment_type" NOT NULL,
  "experience_level" text,
  "location_label" text,
  "remote_status" text,
  "short_description" text NOT NULL,
  "responsibilities" text NOT NULL,
  "required_skills" text NOT NULL,
  "preferred_skills" text,
  "status" "career_job_status" NOT NULL DEFAULT 'draft',
  "published_at" timestamp with time zone,
  "closes_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "career_job_openings_slug_idx" ON "career_job_openings" ("slug");
CREATE INDEX IF NOT EXISTS "career_job_openings_status_idx" ON "career_job_openings" ("status");

CREATE TABLE IF NOT EXISTS "career_applications" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "job_opening_id" uuid REFERENCES "career_job_openings"("id") ON DELETE SET NULL,
  "full_name" text NOT NULL,
  "email" text NOT NULL,
  "phone" text,
  "city" text,
  "country" text,
  "role_interest" text NOT NULL,
  "application_type" "career_application_type" NOT NULL,
  "experience_level" text,
  "skills" text NOT NULL,
  "portfolio_url" text,
  "linkedin_url" text,
  "github_url" text,
  "introduction" text NOT NULL,
  "availability" text NOT NULL,
  "preferred_engagement" text,
  "additional_info" text,
  "resume_storage_key" text,
  "resume_file_name" text,
  "resume_mime_type" text,
  "resume_file_size_bytes" integer,
  "status" "career_application_status" NOT NULL DEFAULT 'new',
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "career_applications_status_idx" ON "career_applications" ("status");
CREATE INDEX IF NOT EXISTS "career_applications_email_idx" ON "career_applications" ("email");
CREATE INDEX IF NOT EXISTS "career_applications_created_at_idx" ON "career_applications" ("created_at");
CREATE INDEX IF NOT EXISTS "career_applications_job_opening_id_idx" ON "career_applications" ("job_opening_id");

CREATE TABLE IF NOT EXISTS "career_application_notes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "application_id" uuid NOT NULL REFERENCES "career_applications"("id") ON DELETE CASCADE,
  "author_user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "content" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "career_application_notes_application_id_idx"
  ON "career_application_notes" ("application_id");
