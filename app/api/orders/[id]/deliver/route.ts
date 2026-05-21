import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { requireMixologistSession } from "@/lib/auth";
import { serializeOrder } from "@/lib/orders";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireMixologistSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const db = getDb();
    const [order] = await db.select().from(orders).where(eq(orders.id, id));

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status !== "READY") {
      return NextResponse.json(
        { error: "Only ready orders can be marked as delivered." },
        { status: 409 },
      );
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "DELIVERED",
        deliveredAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    return NextResponse.json(serializeOrder(updatedOrder));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order." },
      { status: 500 },
    );
  }
}
