-- Phase 4.13: project file lifecycle metadata on existing files table

ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "status" text NOT NULL DEFAULT 'active';

ALTER TABLE "files" ADD COLUMN IF NOT EXISTS "updated_at" timestamptz NOT NULL DEFAULT now();

UPDATE "files" SET "status" = 'active' WHERE "status" IS NULL;

CREATE INDEX IF NOT EXISTS "files_status_idx" ON "files" ("status");
