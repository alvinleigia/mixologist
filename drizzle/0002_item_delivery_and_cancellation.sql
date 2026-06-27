ALTER TYPE "public"."order_item_status" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "public"."order_item_status" ADD VALUE IF NOT EXISTS 'CANCELLED';

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "delivered_at" timestamp,
  ADD COLUMN IF NOT EXISTS "cancelled_at" timestamp;

UPDATE "order_items" AS item
SET
  "status" = CASE
    WHEN parent."status" = 'DELIVERED' THEN 'DELIVERED'::"order_item_status"
    WHEN parent."status" = 'CANCELLED' THEN 'CANCELLED'::"order_item_status"
    ELSE item."status"
  END,
  "delivered_at" = CASE
    WHEN parent."status" = 'DELIVERED'
      THEN COALESCE(parent."delivered_at", parent."updated_at")
    ELSE item."delivered_at"
  END,
  "cancelled_at" = CASE
    WHEN parent."status" = 'CANCELLED'
      THEN COALESCE(parent."cancelled_at", parent."updated_at")
    ELSE item."cancelled_at"
  END
FROM "orders" AS parent
WHERE item."order_id" = parent."id";
