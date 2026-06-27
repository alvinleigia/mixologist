"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/shared/EmptyState";
import { OrderCard } from "@/components/staff/OrderCard";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Spinner } from "@/components/shared/Spinner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderItemStatus } from "@/lib/constants";

type StaffOrder = {
  orderId: string;
  orderNo: number;
  customerName: string;
  categoryName: string;
  drinkName: string;
  itemCount?: number;
  items?: Array<{
    id?: string;
    categoryId: string;
    categoryName: string;
    drinkId: string;
    drinkName: string;
    quantity: number;
    notes: string | null;
    unitPrice: string | null;
    status: OrderItemStatus;
    startedAt: string | null;
    readyAt: string | null;
    deliveredAt: string | null;
    cancelledAt: string | null;
  }>;
  status: "PENDING" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED";
  createdAt: string;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
};

type OrdersPayload = {
  activeOrders: StaffOrder[];
  pastOrders: StaffOrder[];
};

type StaffTab = "active" | "past";

function playAnnouncement(customerName: string, drinkName: string) {
  const message = `${customerName}, your ${drinkName} is ready. Please collect it from the bar.`;
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.rate = 0.9;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

export function StaffOrderBoard() {
  const [orders, setOrders] = useState<OrdersPayload>({
    activeOrders: [],
    pastOrders: [],
  });
  const [activeTab, setActiveTab] = useState<StaffTab>("active");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [clearConfirmationText, setClearConfirmationText] = useState("");

  async function syncOrders() {
    setIsRefreshing(true);
    const response = await fetch("/api/orders");
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to load orders.");
      setIsRefreshing(false);
      setHasLoadedOnce(true);
      return;
    }

    setOrders({
      activeOrders: payload.activeOrders ?? [],
      pastOrders: payload.pastOrders ?? [],
    });
    setError(null);
    setIsRefreshing(false);
    setHasLoadedOnce(true);
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchOrders() {
      const response = await fetch("/api/orders");
      const payload = await response.json();

      if (!response.ok) {
        if (isMounted) {
          setError(payload.error ?? "Failed to load orders.");
          setHasLoadedOnce(true);
        }
        return;
      }

      if (isMounted) {
        setOrders({
          activeOrders: payload.activeOrders ?? [],
          pastOrders: payload.pastOrders ?? [],
        });
        setError(null);
        setHasLoadedOnce(true);
      }
    }

    fetchOrders();
    const interval = window.setInterval(fetchOrders, 4000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  async function runItemAction(
    orderId: string,
    itemId: string,
    action: "start" | "ready" | "deliver" | "cancel",
  ) {
    setPendingAction(`${action}-item:${itemId}`);

    const response = await fetch(
      `/api/orders/${orderId}/items/${itemId}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to update item.");
      toast.error(payload.error ?? "Failed to update item.");
      setPendingAction(null);
      return;
    }

    await syncOrders();
    const successMessage = {
      start: "Item preparation started.",
      ready: "Item marked ready.",
      deliver: "Item marked delivered.",
      cancel: "Item cancelled.",
    }[action];
    toast.success(successMessage);
    setPendingAction(null);
  }

  async function announceItem(
    orderId: string,
    itemId: string,
    customerName: string,
    drinkName: string,
  ) {
    setPendingAction(`announce-item:${itemId}`);
    playAnnouncement(customerName, drinkName);

    const response = await fetch(
      `/api/orders/${orderId}/items/${itemId}/status`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "announce" }),
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to record announcement.");
      toast.error(payload.error ?? "Failed to record announcement.");
    }

    setPendingAction(null);
  }

  async function clearAllOrders() {
    setPendingAction("clear-all");

    const response = await fetch("/api/orders/clear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmationText: clearConfirmationText }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload.error ?? "Failed to clear orders.");
      toast.error(payload.error ?? "Failed to clear orders.");
      setPendingAction(null);
      return;
    }

    setOrders({ activeOrders: [], pastOrders: [] });
    setError(null);
    setClearConfirmationText("");
    setIsClearDialogOpen(false);
    setHasLoadedOnce(true);
    setIsRefreshing(false);
    toast.success(payload.message ?? "All order records cleared.");
    setPendingAction(null);
  }

  const visibleOrders =
    activeTab === "active" ? orders.activeOrders : orders.pastOrders;

  return (
    <Card className="rounded-xl border-white/60 bg-white/85 shadow-[0_20px_60px_rgba(40,26,20,0.08)]">
      <CardHeader className="px-6 pt-6">
        <SectionHeader
          eyebrow="Operations"
          title="Orders panel"
          meta={
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
              {pendingAction ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-3.5 text-stone-400" />
                  Updating order...
                </span>
              ) : isRefreshing ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="size-3.5 text-stone-400" />
                  Refreshing panel...
                </span>
              ) : (
                "Live polling every 4 seconds"
              )}
            </p>
          }
          className="mb-0"
        />
      </CardHeader>
      <CardContent className="px-6 pb-6">
      {error ? <p className="mb-4 text-sm text-rose-600">{error}</p> : null}

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as StaffTab)}>
          <TabsList>
            <TabsTrigger value="active" disabled={Boolean(pendingAction)}>
              Active Orders ({orders.activeOrders.length})
            </TabsTrigger>
            <TabsTrigger value="past" disabled={Boolean(pendingAction)}>
              Past Orders ({orders.pastOrders.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          type="button"
          variant="destructive"
          disabled={Boolean(pendingAction)}
          className="rounded-lg"
          onClick={() => setIsClearDialogOpen(true)}
        >
          Clear All Orders
        </Button>
      </div>

      {!hasLoadedOnce && isRefreshing ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-xl border-stone-200 bg-white shadow-none">
              <CardContent className="space-y-4 px-5 py-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-28" />
                <div className="flex gap-3">
                  <Skeleton className="h-9 w-32 rounded-lg" />
                  <Skeleton className="h-9 w-24 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : visibleOrders.length === 0 ? (
        <EmptyState
          title={activeTab === "active" ? "No active orders yet" : "No past orders yet"}
          description={
            activeTab === "active"
              ? "This tab keeps refreshing automatically every 4 seconds."
              : "Delivered and cancelled orders will appear here."
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {visibleOrders.map((order) => (
            <OrderCard
              key={order.orderId}
              order={order}
              onItemAction={runItemAction}
              onItemAnnounce={announceItem}
              pendingAction={pendingAction}
              disabled={Boolean(pendingAction)}
            />
          ))}
        </div>
      )}
      </CardContent>
      <AlertDialog
        open={isClearDialogOpen}
        onOpenChange={(open) => {
          if (pendingAction === "clear-all") {
            return;
          }

          setIsClearDialogOpen(open);

          if (!open) {
            setClearConfirmationText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all order records?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes every order from both the active and past tabs.
              To confirm, type <span className="font-semibold text-stone-900">delete</span> below.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <p className="text-sm font-medium text-stone-700">Type delete to continue</p>
            <Input
              value={clearConfirmationText}
              onChange={(event) => setClearConfirmationText(event.target.value)}
              placeholder="delete"
              autoComplete="off"
              disabled={pendingAction === "clear-all"}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pendingAction === "clear-all"}>Keep Records</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pendingAction === "clear-all" || clearConfirmationText.trim().toLowerCase() !== "delete"}
              onClick={(event) => {
                event.preventDefault();
                void clearAllOrders();
              }}
            >
              {pendingAction === "clear-all" ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="text-rose-700" />
                  Clearing...
                </span>
              ) : (
                "Delete All Orders"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
