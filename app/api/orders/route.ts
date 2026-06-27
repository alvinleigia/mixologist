import { NextRequest, NextResponse } from "next/server";
import { generateCustomerToken } from "@/lib/order-token";
import { getNextOrderNumber } from "@/lib/order-number";
import { createOrderSchema } from "@/lib/validations/order";
import {
  buildOrderSummary,
  getStaffOrders,
  getOrderItemsForOrders,
  serializeOrder,
} from "@/lib/orders";
import { getOrdersResetAt } from "@/lib/order-reset";
import { getMenuSelectionSnapshot } from "@/lib/menu";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireStaffSession } from "@/lib/auth";
import { getCurrentTenantContext } from "@/lib/tenant-context";

export async function GET() {
  try {
    const session = await requireStaffSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantContext();
    const { activeOrders, pastOrders } = await getStaffOrders(tenantContext);
    const itemMap = await getOrderItemsForOrders(
      [...activeOrders, ...pastOrders].map((order) => order.id),
      tenantContext,
    );

    return NextResponse.json({
      activeOrders: activeOrders.map((order) => serializeOrder(order, itemMap.get(order.id) ?? [])),
      pastOrders: pastOrders.map((order) => serializeOrder(order, itemMap.get(order.id) ?? [])),
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
    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);
    const tenantContext = await getCurrentTenantContext();

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
      const { category, item } = await getMenuSelectionSnapshot(
        requestedItem.categoryId,
        requestedItem.drinkId,
        tenantContext,
      );

      if (!category || !item) {
        return NextResponse.json({ error: "Invalid drink selection." }, { status: 400 });
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
    const orderNo = await getNextOrderNumber();
    const summaryCategoryName =
      cartItems.length === 1 ? cartItems[0].categoryName : `${cartItems.length} categories`;
    const summaryDrinkName = buildOrderSummary(
      cartItems.map((item) => ({ drinkName: item.drinkName, quantity: item.quantity })),
    );

    const createdOrder = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          organizationId: tenantContext.organizationId,
          locationId: tenantContext.locationId,
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
      ordersResetAt: await getOrdersResetAt(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order." },
      { status: 500 },
    );
  }
}
