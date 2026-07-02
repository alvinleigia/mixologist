import { NextRequest, NextResponse } from "next/server";

import { getTenantMenuCurrency } from "@/lib/menu";
import { getCustomerOrders, getOrderItemsForOrders, serializeOrder } from "@/lib/orders";
import { getOrdersResetAt } from "@/lib/order-reset";
import {
  checkRateLimit,
  getRequestRateLimitKey,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { getPublicTenantContextFromRequest } from "@/lib/tenant-context";
import { orderStatusRequestSchema } from "@/lib/validations/order";

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: getRequestRateLimitKey(request, "public:order-status"),
      limit: 45,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json();
    const parsed = orderStatusRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const tenantContext = await getPublicTenantContextFromRequest(request);
    const [matchingOrders, currency] = await Promise.all([
      getCustomerOrders(parsed.data.orders, tenantContext),
      getTenantMenuCurrency(tenantContext),
    ]);
    const itemMap = await getOrderItemsForOrders(
      matchingOrders.map((order) => order.id),
      tenantContext,
    );
    return NextResponse.json({
      orders: matchingOrders.map((order) => serializeOrder(order, itemMap.get(order.id) ?? [])),
      currency,
      ordersResetAt: await getOrdersResetAt(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order statuses." },
      { status: 500 },
    );
  }
}
