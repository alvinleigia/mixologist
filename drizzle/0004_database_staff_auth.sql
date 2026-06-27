DO $$ BEGIN
 CREATE TYPE "public"."user_status" AS ENUM('INVITED', 'ACTIVE', 'DISABLED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "username" text,
  ADD COLUMN IF NOT EXISTS "status" "user_status" DEFAULT 'ACTIVE' NOT NULL,
  ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;

UPDATE "users"
SET
  "username" = COALESCE(
    "username",
    NULLIF(split_part("email", '@', 1), ''),
    lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')),
    'user'
  ),
  "status" = COALESCE("status", 'ACTIVE'::"user_status"),
  "updated_at" = now()
WHERE "username" IS NULL;

ALTER TABLE "users"
  ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "users_username_unique"
  ON "users" ("username");
