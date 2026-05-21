"use client";

import { useState } from "react";

import { AppShell } from "@/components/shared/AppShell";
import { CustomerOrderStatus } from "@/components/order/CustomerOrderStatus";
import { OrderForm } from "@/components/order/OrderForm";

export default function OrderPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell variant="warm" contentClassName="grid max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <CustomerOrderStatus refreshKey={refreshKey} />
      <OrderForm onOrderCreated={() => setRefreshKey((value) => value + 1)} />
    </AppShell>
  );
}
