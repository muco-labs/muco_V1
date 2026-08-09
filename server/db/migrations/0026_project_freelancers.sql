-- Phase 4.17: Freelancer project assignment (separate from employee project_members)

CREATE TABLE IF NOT EXISTS "project_freelancers" (
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "freelancer_id" uuid NOT NULL REFERENCES "freelancer_profiles"("id") ON DELETE CASCADE,
  "role" text NOT NULL,
  CONSTRAINT "project_freelancers_project_id_freelancer_id_pk" PRIMARY KEY ("project_id", "freelancer_id")
);

CREATE INDEX IF NOT EXISTS "project_freelancers_freelancer_id_idx" ON "project_freelancers" ("freelancer_id");

ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "assigned_freelancer_id" uuid REFERENCES "freelancer_profiles"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "tasks_assigned_freelancer_id_idx" ON "tasks" ("assigned_freelancer_id");
