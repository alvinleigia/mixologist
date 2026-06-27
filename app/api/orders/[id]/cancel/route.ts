import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { getDb } from "@/db";
import { orders } from "@/db/schema";
import { requireStaffSession } from "@/lib/auth";
import { customerCancelOrderSchema, staffCancelOrderSchema } from "@/lib/validations/order";
import { serializeOrder } from "@/lib/orders";
import { getCurrentTenantContext } from "@/lib/tenant-context";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const session = await requireStaffSession();
    const isStaff = Boolean(session);
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

    const parsed = isStaff
      ? staffCancelOrderSchema.safeParse(body)
      : customerCancelOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    if (isStaff) {
      if (order.status !== "PENDING" && order.status !== "READY") {
        return NextResponse.json(
          {
            error:
              "Staff can only cancel orders while they are pending or ready for pickup.",
          },
          { status: 409 },
        );
      }

      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: "CANCELLED",
          cancelReason: parsed.data.cancelReason?.trim() || null,
          cancelledAt: new Date(),
          cancelledByType: "STAFF",
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

      return NextResponse.json(serializeOrder(updatedOrder));
    }

    if (order.status !== "PENDING") {
      return NextResponse.json(
        {
          error:
            "This order cannot be cancelled because preparation has already started.",
        },
        { status: 409 },
      );
    }

    const customerPayload = customerCancelOrderSchema.parse(body);

    if (customerPayload.customerToken !== order.customerToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [updatedOrder] = await db
      .update(orders)
      .set({
        status: "CANCELLED",
        cancelReason: customerPayload.cancelReason?.trim() || null,
        cancelledAt: new Date(),
        cancelledByType: "CUSTOMER",
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

    return NextResponse.json(serializeOrder(updatedOrder));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel order." },
      { status: 500 },
    );
  }
}
