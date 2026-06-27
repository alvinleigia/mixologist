DO $$ BEGIN
 CREATE TYPE "public"."order_item_status" AS ENUM('PENDING', 'PREPARING', 'READY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "status" "order_item_status" DEFAULT 'PENDING' NOT NULL,
  ADD COLUMN IF NOT EXISTS "started_at" timestamp,
  ADD COLUMN IF NOT EXISTS "ready_at" timestamp;

UPDATE "order_items" AS item
SET
  "status" = CASE
    WHEN parent."status" IN ('READY', 'DELIVERED') THEN 'READY'::"order_item_status"
    WHEN parent."status" = 'PREPARING' THEN 'PREPARING'::"order_item_status"
    ELSE 'PENDING'::"order_item_status"
  END,
  "started_at" = CASE
    WHEN parent."status" IN ('PREPARING', 'READY', 'DELIVERED')
      THEN COALESCE(parent."started_at", parent."created_at")
    ELSE NULL
  END,
  "ready_at" = CASE
    WHEN parent."status" IN ('READY', 'DELIVERED')
      THEN COALESCE(parent."ready_at", parent."delivered_at", parent."updated_at")
    ELSE NULL
  END
FROM "orders" AS parent
WHERE item."order_id" = parent."id";
