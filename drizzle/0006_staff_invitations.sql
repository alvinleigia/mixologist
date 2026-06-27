CREATE TABLE IF NOT EXISTS "staff_invitations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "membership_id" uuid NOT NULL REFERENCES "memberships"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "accepted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "staff_invitations_token_hash_unique"
ON "staff_invitations" ("token_hash");

CREATE INDEX IF NOT EXISTS "staff_invitations_user_idx"
ON "staff_invitations" ("user_id");

CREATE INDEX IF NOT EXISTS "staff_invitations_membership_idx"
ON "staff_invitations" ("membership_id");
