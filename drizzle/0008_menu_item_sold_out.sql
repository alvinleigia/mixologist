ALTER TABLE "menu_items"
  ADD COLUMN IF NOT EXISTS "is_sold_out" boolean DEFAULT false NOT NULL;
