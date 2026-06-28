CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "actor_username" text,
  "actor_role" "membership_role",
  "organization_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL,
  "location_id" uuid REFERENCES "locations"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text,
  "metadata" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "audit_logs_actor_user_idx"
  ON "audit_logs" ("actor_user_id");

CREATE INDEX IF NOT EXISTS "audit_logs_organization_idx"
  ON "audit_logs" ("organization_id");

CREATE INDEX IF NOT EXISTS "audit_logs_location_idx"
  ON "audit_logs" ("location_id");

CREATE INDEX IF NOT EXISTS "audit_logs_action_idx"
  ON "audit_logs" ("action");

CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx"
  ON "audit_logs" ("created_at");
