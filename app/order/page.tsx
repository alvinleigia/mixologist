"use client";

import { useState } from "react";
import { ClipboardListIcon } from "lucide-react";

import { AppShell } from "@/components/shared/AppShell";
import { CustomerOrderStatus } from "@/components/order/CustomerOrderStatus";
import { OrderForm } from "@/components/order/OrderForm";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function OrderPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AppShell variant="warm" contentClassName="max-w-6xl space-y-6">
      <div className="flex justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-stone-300 bg-white/90 text-stone-800 hover:bg-stone-100"
            >
              <ClipboardListIcon className="size-4" />
              View Order Status
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>Your recent orders</SheetTitle>
              <SheetDescription>
                Orders placed on this device keep syncing automatically with the bar.
              </SheetDescription>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              <CustomerOrderStatus refreshKey={refreshKey} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <OrderForm onOrderCreated={() => setRefreshKey((value) => value + 1)} />
    </AppShell>
  );
}
