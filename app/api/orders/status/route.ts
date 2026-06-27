import { NextRequest, NextResponse } from "next/server";

import { getCustomerOrders, getOrderItemsForOrders, serializeOrder } from "@/lib/orders";
import { getOrdersResetAt } from "@/lib/order-reset";
import { getCurrentTenantContext } from "@/lib/tenant-context";
import { orderStatusRequestSchema } from "@/lib/validations/order";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = orderStatusRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const tenantContext = await getCurrentTenantContext();
    const matchingOrders = await getCustomerOrders(parsed.data.orders, tenantContext);
    const itemMap = await getOrderItemsForOrders(
      matchingOrders.map((order) => order.id),
      tenantContext,
    );
    return NextResponse.json({
      orders: matchingOrders.map((order) => serializeOrder(order, itemMap.get(order.id) ?? [])),
      ordersResetAt: await getOrdersResetAt(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order statuses." },
      { status: 500 },
    );
  }
}
