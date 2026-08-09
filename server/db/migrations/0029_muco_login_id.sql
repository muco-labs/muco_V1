ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "muco_login_id" text;

CREATE UNIQUE INDEX IF NOT EXISTS "users_muco_login_id_idx" ON "users" ("muco_login_id")
WHERE "muco_login_id" IS NOT NULL;
