-- Phase 11: employee org fields (no fake org data)

DO $$ BEGIN
  CREATE TYPE "employee_employment_state" AS ENUM (
    'onboarding',
    'active',
    'on_leave',
    'offboarded'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "employee_profiles"
  ADD COLUMN IF NOT EXISTS "employment_state" "employee_employment_state" NOT NULL DEFAULT 'active';

ALTER TABLE "employee_profiles"
  ADD COLUMN IF NOT EXISTS "manager_employee_id" uuid REFERENCES "employee_profiles" ("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "employee_profiles_manager_employee_id_idx"
  ON "employee_profiles" ("manager_employee_id");

CREATE INDEX IF NOT EXISTS "employee_profiles_department_idx"
  ON "employee_profiles" ("department");
