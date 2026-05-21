import { NextRequest, NextResponse } from "next/server";

import { getCustomerOrders, serializeOrder } from "@/lib/orders";
import { orderStatusRequestSchema } from "@/lib/validations/order";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = orderStatusRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const matchingOrders = await getCustomerOrders(parsed.data.orders);
    return NextResponse.json({ orders: matchingOrders.map(serializeOrder) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch order statuses." },
      { status: 500 },
    );
  }
}
