ALTER TABLE "locations"
  ADD COLUMN IF NOT EXISTS "qr_slug" text;

CREATE UNIQUE INDEX IF NOT EXISTS "locations_qr_slug_unique"
  ON "locations" ("qr_slug");
