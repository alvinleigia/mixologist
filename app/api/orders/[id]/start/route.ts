import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { requireStaffSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { serializeOrder } from "@/lib/orders";
import { getCurrentTenantContext } from "@/lib/tenant-context";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireStaffSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const tenantContext = await getCurrentTenantContext();
    const db = getDb();
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, id),
          eq(orders.organizationId, tenantContext.organizationId),
          eq(orders.locationId, tenantContext.locationId),
        ),
      );

    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        { error: "Only pending orders can be marked as preparing." },
        { status: 409 },
      );
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "PREPARING",
        startedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(orders.id, id),
          eq(orders.organizationId, tenantContext.organizationId),
          eq(orders.locationId, tenantContext.locationId),
        ),
      )
      .returning();

    await writeAuditLog({
      actor: session.user,
      organizationId: tenantContext.organizationId,
      locationId: tenantContext.locationId,
      action: "order.start",
      entityType: "order",
      entityId: updatedOrder.id,
      metadata: {
        orderNo: updatedOrder.orderNo,
        previousStatus: order.status,
        nextStatus: updatedOrder.status,
      },
    });

    return NextResponse.json(serializeOrder(updatedOrder));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update order." },
      { status: 500 },
    );
  }
}
