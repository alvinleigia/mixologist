import { NextRequest, NextResponse } from "next/server";
import { generateCustomerToken } from "@/lib/order-token";
import { getLocationBusinessDate, getNextOrderNumber } from "@/lib/order-number";
import { createOrderSchema } from "@/lib/validations/order";
import {
  buildOrderSummary,
  getStaffOrders,
  getOrderItemsForOrders,
  serializeOrder,
} from "@/lib/orders";
import { getOrdersResetAt } from "@/lib/order-reset";
import { getMenuSelectionSnapshot, getTenantMenuCurrency } from "@/lib/menu";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireStaffSession } from "@/lib/auth";
import {
  checkRateLimit,
  getRequestRateLimitKey,
  rateLimitResponse,
} from "@/lib/rate-limit";
import { getCurrentTenantContext, getPublicTenantContextFromRequest } from "@/lib/tenant-context";

export async function GET() {
  try {
    const session = await requireStaffSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantContext();
    const [{ activeOrders, pastOrders }, currency] = await Promise.all([
      getStaffOrders(tenantContext),
      getTenantMenuCurrency(tenantContext),
    ]);
    const itemMap = await getOrderItemsForOrders(
      [...activeOrders, ...pastOrders].map((order) => order.id),
      tenantContext,
    );

    return NextResponse.json({
      activeOrders: activeOrders.map((order) => serializeOrder(order, itemMap.get(order.id) ?? [])),
      pastOrders: pastOrders.map((order) => serializeOrder(order, itemMap.get(order.id) ?? [])),
      currency,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch orders." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimit = checkRateLimit({
      key: getRequestRateLimitKey(request, "public:order-create"),
      limit: 12,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    const tenantContext = await getPublicTenantContextFromRequest(request);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const cartItems: Array<{
      categoryId: string;
      organizationId: string;
      locationId: string;
      categoryName: string;
      drinkId: string;
      drinkName: string;
      quantity: number;
      notes: string | null;
      unitPrice: string | null;
      status: "PENDING";
      startedAt: null;
      readyAt: null;
      deliveredAt: null;
      cancelledAt: null;
    }> = [];

    for (const requestedItem of parsed.data.items) {
      const { category, inventory, item } = await getMenuSelectionSnapshot(
        requestedItem.categoryId,
        requestedItem.drinkId,
        tenantContext,
      );

      if (!category || !item) {
        return NextResponse.json({ error: "Invalid drink selection." }, { status: 400 });
      }

      if (inventory?.isTracked && Number(inventory.currentQuantity) < requestedItem.quantity) {
        return NextResponse.json(
          { error: `${item.name} is currently out of stock.` },
          { status: 409 },
        );
      }

      cartItems.push({
        categoryId: category.id,
        organizationId: tenantContext.organizationId,
        locationId: tenantContext.locationId,
        categoryName: category.name,
        drinkId: item.id,
        drinkName: item.name,
        quantity: requestedItem.quantity,
        notes: requestedItem.notes?.trim() || null,
        unitPrice: item.price ?? null,
        status: "PENDING",
        startedAt: null,
        readyAt: null,
        deliveredAt: null,
        cancelledAt: null,
      });
    }

    const db = getDb();
    const customerToken = generateCustomerToken();
    const summaryCategoryName =
      cartItems.length === 1 ? cartItems[0].categoryName : `${cartItems.length} categories`;
    const summaryDrinkName = buildOrderSummary(
      cartItems.map((item) => ({ drinkName: item.drinkName, quantity: item.quantity })),
    );

    const createdOrder = await db.transaction(async (tx) => {
      const orderDate = await getLocationBusinessDate(tx, tenantContext);
      const orderNo = await getNextOrderNumber(tx, tenantContext, orderDate);
      const [newOrder] = await tx
        .insert(orders)
        .values({
          organizationId: tenantContext.organizationId,
          locationId: tenantContext.locationId,
          orderDate,
          orderNo,
          customerName: parsed.data.customerName.trim(),
          customerToken,
          categoryId: cartItems[0].categoryId,
          categoryName: summaryCategoryName,
          drinkId: cartItems[0].drinkId,
          drinkName: summaryDrinkName,
        })
        .returning();

      await tx.insert(orderItems).values(
        cartItems.map((item) => ({
          organizationId: tenantContext.organizationId,
          locationId: tenantContext.locationId,
          orderId: newOrder.id,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          drinkId: item.drinkId,
          drinkName: item.drinkName,
          quantity: item.quantity,
          notes: item.notes,
          unitPrice: item.unitPrice,
          updatedAt: new Date(),
        })),
      );

      return newOrder;
    });

    return NextResponse.json({
      ...serializeOrder(createdOrder, cartItems),
      currency: await getTenantMenuCurrency(tenantContext),
      ordersResetAt: await getOrdersResetAt(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order." },
      { status: 500 },
    );
  }
}
