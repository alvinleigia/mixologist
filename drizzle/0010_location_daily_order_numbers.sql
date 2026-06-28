ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "order_date" date;

UPDATE "orders"
SET "order_date" = COALESCE("order_date", "created_at"::date)
WHERE "order_date" IS NULL;

ALTER TABLE "orders"
  ALTER COLUMN "order_date" SET NOT NULL;

ALTER TABLE "orders"
  DROP CONSTRAINT IF EXISTS "orders_order_no_unique";

CREATE UNIQUE INDEX IF NOT EXISTS "orders_location_order_date_no_unique"
  ON "orders" ("organization_id", "location_id", "order_date", "order_no");
