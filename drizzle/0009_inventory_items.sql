CREATE TABLE IF NOT EXISTS "inventory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "location_id" uuid NOT NULL REFERENCES "locations"("id") ON DELETE CASCADE,
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE,
  "unit" text DEFAULT 'servings' NOT NULL,
  "current_quantity" numeric(10, 2) DEFAULT '0' NOT NULL,
  "low_stock_threshold" numeric(10, 2) DEFAULT '0' NOT NULL,
  "is_tracked" boolean DEFAULT true NOT NULL,
  "notes" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "inventory_items_organization_idx"
  ON "inventory_items" ("organization_id");

CREATE INDEX IF NOT EXISTS "inventory_items_location_idx"
  ON "inventory_items" ("location_id");

CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_menu_item_unique"
  ON "inventory_items" ("organization_id", "location_id", "menu_item_id");
