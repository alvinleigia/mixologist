import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { orders } from "@/db/schema";

export async function getNextOrderNumber() {
  const db = getDb();
  const [row] = await db
    .select({
      nextOrderNo: sql<number>`coalesce(max(${orders.orderNo}), 0) + 1`,
    })
    .from(orders);

  return row?.nextOrderNo ?? 1;
}
