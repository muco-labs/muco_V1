ALTER TYPE "public"."user_status" ADD VALUE IF NOT EXISTS 'invited';
--> statement-breakpoint
ALTER TYPE "public"."user_status" ADD VALUE IF NOT EXISTS 'disabled';
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "auth_user_id" uuid;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" text;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_auth_user_id_idx" ON "users" USING btree ("auth_user_id");
