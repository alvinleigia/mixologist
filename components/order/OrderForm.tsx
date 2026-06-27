"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckIcon,
  ImageIcon,
  MinusIcon,
  PlusIcon,
  ShoppingCartIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { LocalCustomerOrder } from "@/lib/constants";
import {
  readStoredCustomerOrders,
  syncCustomerOrdersResetMarker,
  writeStoredCustomerOrders,
} from "@/lib/customer-orders";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FormField } from "@/components/shared/FormField";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Spinner } from "@/components/shared/Spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { MenuCategoryRecord, MenuItemRecord } from "@/types/menu";

type OrderFormProps = {
  onOrderCreated: (order: LocalCustomerOrder) => void;
};

type CartItem = {
  categoryId: string;
  categoryName: string;
  drinkId: string;
  drinkName: string;
  quantity: number;
  notes: string;
  unitPrice: string | null;
};

type OrderDraft = {
  customerName: string;
};

function getApiErrorMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "Failed to place order.";
  }

  const maybeError = (payload as { error?: unknown }).error;

  if (typeof maybeError === "string") {
    return maybeError;
  }

  if (maybeError && typeof maybeError === "object") {
    const fieldErrors = (maybeError as { fieldErrors?: Record<string, string[] | undefined> })
      .fieldErrors;
    const formErrors = (maybeError as { formErrors?: string[] }).formErrors;

    const firstFieldMessage = fieldErrors
      ? Object.values(fieldErrors).flat().find((message) => typeof message === "string")
      : undefined;

    if (firstFieldMessage) {
      return firstFieldMessage;
    }

    if (formErrors?.[0]) {
      return formErrors[0];
    }
  }

  return "Failed to place order.";
}

function formatPrice(price: string | null) {
  return price ? `INR ${Number(price).toFixed(2)}` : "Price on request";
}

export function OrderForm({ onOrderCreated }: OrderFormProps) {
  const [menuCategories, setMenuCategories] = useState<MenuCategoryRecord[]>([]);
  const [draft, setDraft] = useState<OrderDraft>({
    customerName: "",
  });
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function loadMenu() {
      setIsLoadingMenu(true);
      const response = await fetch("/api/menu");
      const payload = await response.json();

      if (!response.ok) {
        if (isMounted) {
          setMenuError(payload.error ?? "Failed to load the menu.");
          setMenuCategories([]);
          setIsLoadingMenu(false);
        }
        return;
      }

      if (isMounted) {
        setMenuCategories(payload.categories ?? []);
        setMenuError(null);
        setIsLoadingMenu(false);
        setOpenCategoryId(payload.categories?.[0]?.id);
      }
    }

    void loadMenu();

    return () => {
      isMounted = false;
    };
  }, []);

  const totalProducts = useMemo(
    () => menuCategories.reduce((count, category) => count + category.items.length, 0),
    [menuCategories],
  );

  const totalQuantity = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  );

  const totalAmount = useMemo(() => {
    const pricedTotal = cartItems.reduce((sum, item) => {
      if (!item.unitPrice) {
        return sum;
      }

      return sum + Number(item.unitPrice) * item.quantity;
    }, 0);

    const hasAnyPrice = cartItems.some((item) => item.unitPrice);
    return hasAnyPrice ? pricedTotal.toFixed(2) : null;
  }, [cartItems]);

  function updateDraft<K extends keyof OrderDraft>(key: K, value: OrderDraft[K]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      [key]: value,
    }));
  }

  function addToCart(category: MenuCategoryRecord, drink: MenuItemRecord) {
    setCartItems((currentItems) => {
      const existingIndex = currentItems.findIndex((item) => item.drinkId === drink.id);

      if (existingIndex >= 0) {
        return currentItems.map((item, index) =>
          index === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }

      return [
        ...currentItems,
        {
          categoryId: category.id,
          categoryName: category.name,
          drinkId: drink.id,
          drinkName: drink.name,
          quantity: 1,
          notes: "",
          unitPrice: drink.price ?? null,
        },
      ];
    });
    setError(null);
  }

  function updateCartItem(drinkId: string, updater: (item: CartItem) => CartItem | null) {
    setCartItems((currentItems) =>
      currentItems.flatMap((item) => {
        if (item.drinkId !== drinkId) {
          return [item];
        }

        const nextItem = updater(item);
        return nextItem ? [nextItem] : [];
      }),
    );
  }

  function validateDraft() {
    if (draft.customerName.trim().length < 2) {
      return "Please enter the customer's name.";
    }

    if (cartItems.length === 0) {
      return "Add at least one drink to the cart.";
    }

    return null;
  }

  function openConfirmation(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateDraft();

    if (validationError) {
      setError(validationError);
      setIsConfirmOpen(false);
      return;
    }

    setError(null);
    setIsConfirmOpen(true);
  }

  async function confirmOrder() {
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: draft.customerName.trim(),
        items: cartItems.map((item) => ({
          categoryId: item.categoryId,
          drinkId: item.drinkId,
          quantity: item.quantity,
          notes: item.notes.trim(),
        })),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(getApiErrorMessage(payload));
      setIsSubmitting(false);
      setIsConfirmOpen(false);
      return;
    }

    const nextOrder: LocalCustomerOrder = {
      orderId: payload.orderId,
      orderNo: payload.orderNo,
      customerToken: payload.customerToken,
      customerName: payload.customerName,
      categoryName: payload.categoryName,
      drinkName: payload.drinkName,
      itemCount: payload.itemCount,
      items: payload.items,
      status: payload.status,
      createdAt: payload.createdAt,
    };

    syncCustomerOrdersResetMarker(payload.ordersResetAt ?? null);
    const existingOrders = readStoredCustomerOrders();
    writeStoredCustomerOrders([nextOrder, ...existingOrders]);

    onOrderCreated(nextOrder);
    toast.success(`Order #${payload.orderNo} placed successfully.`);
    setDraft({ customerName: "" });
    setCartItems([]);
    setIsCartOpen(false);
    setIsSubmitting(false);
    setIsConfirmOpen(false);
  }

  return (
    <>
      <Card className="rounded-xl border-white/60 bg-white/88 shadow-[0_20px_60px_rgba(40,26,20,0.08)]">
        <CardHeader className="px-6 pt-6">
          <SectionHeader
            eyebrow="Place an order"
            title="Pick Your Next Pour"
            meta={
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-stone-600">
                  Build the order from the menu, then review everything in the cart drawer.
                </p>
                <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                  <SheetTrigger asChild>
                    <Button
                      type="button"
                      variant={cartItems.length > 0 ? "default" : "outline"}
                      className={
                        cartItems.length > 0
                          ? "rounded-lg bg-stone-950 text-white hover:bg-stone-800"
                          : "rounded-lg border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                      }
                    >
                      <ShoppingCartIcon className="size-4" />
                      Cart ({totalQuantity})
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right">
                    <SheetHeader>
                      <SheetTitle>Your cart</SheetTitle>
                      <SheetDescription>
                        Adjust quantities and add notes for each item before placing the order.
                      </SheetDescription>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-6 py-5">
                      {cartItems.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
                          <p className="text-sm font-medium text-stone-900">Your cart is empty</p>
                          <p className="mt-2 text-sm text-stone-500">
                            Add drinks from the menu cards to start building the order.
                          </p>
                        </div>
                      ) : (
                        <div className="grid gap-4">
                          {cartItems.map((item) => (
                            <div key={item.drinkId} className="rounded-xl border border-stone-200 bg-white p-4">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-base font-semibold text-stone-950">{item.drinkName}</p>
                                  <p className="text-sm text-stone-500">{item.categoryName}</p>
                                  <p className="mt-1 text-sm font-semibold text-stone-900">
                                    {formatPrice(item.unitPrice)}
                                  </p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() => updateCartItem(item.drinkId, () => null)}
                                  className="rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                                >
                                  <Trash2Icon className="size-4" />
                                  Remove
                                </Button>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center gap-3">
                                <div className="inline-flex items-center overflow-hidden rounded-lg border border-stone-200">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      updateCartItem(item.drinkId, (current) =>
                                        current.quantity <= 1
                                          ? null
                                          : { ...current, quantity: current.quantity - 1 },
                                      )
                                    }
                                    className="rounded-none"
                                  >
                                    <MinusIcon className="size-4" />
                                  </Button>
                                  <span className="min-w-12 px-4 text-center text-sm font-semibold text-stone-950">
                                    {item.quantity}
                                  </span>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      updateCartItem(item.drinkId, (current) => ({
                                        ...current,
                                        quantity: Math.min(current.quantity + 1, 20),
                                      }))
                                    }
                                    className="rounded-none"
                                  >
                                    <PlusIcon className="size-4" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mt-4">
                                <FormField label="Notes for this item">
                                  <Textarea
                                    value={item.notes}
                                    onChange={(event) =>
                                      updateCartItem(item.drinkId, (current) => ({
                                        ...current,
                                        notes: event.target.value,
                                      }))
                                    }
                                    rows={2}
                                    placeholder="Less ice, no garnish, serve later..."
                                  />
                                </FormField>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <SheetFooter>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm text-stone-500">{totalQuantity} item(s)</p>
                          <p className="text-base font-semibold text-stone-950">
                            {totalAmount ? `INR ${totalAmount}` : "Price on request"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          onClick={() => {
                            setIsCartOpen(false);
                            setTimeout(() => {
                              const form = document.getElementById("customer-order-form") as HTMLFormElement | null;
                              form?.requestSubmit();
                            }, 0);
                          }}
                          disabled={isSubmitting || isLoadingMenu || Boolean(menuError) || cartItems.length === 0}
                          className="rounded-lg bg-stone-950 text-white hover:bg-stone-800"
                        >
                          Review Order
                        </Button>
                      </div>
                    </SheetFooter>
                  </SheetContent>
                </Sheet>
              </div>
            }
            className="mb-0"
          />
        </CardHeader>

        <CardContent className="px-6 pb-24 md:pb-6">
          <form id="customer-order-form" onSubmit={openConfirmation} className="grid gap-5">
            <FormField label="Customer name" htmlFor="customer-name">
              <Input
                id="customer-name"
                value={draft.customerName}
                onChange={(event) => updateDraft("customerName", event.target.value)}
                placeholder="Enter customer name"
                disabled={isSubmitting}
                className="h-12 rounded-xl border-stone-200 bg-white px-4 text-base"
              />
            </FormField>

            <div className="grid gap-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-950">Choose your drinks</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Tap add on any card, then adjust quantity and notes in the cart.
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                  {isLoadingMenu ? "Loading menu..." : `${menuCategories.length} categories • ${totalProducts} products`}
                </p>
              </div>

              {isLoadingMenu ? (
                <div className="grid gap-4">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <div key={index} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                      <div className="h-5 w-32 animate-pulse rounded-md bg-stone-200" />
                      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 4 }).map((__, cardIndex) => (
                          <div
                            key={cardIndex}
                            className="overflow-hidden rounded-xl border border-stone-200 bg-white"
                          >
                            <div className="aspect-square animate-pulse bg-stone-100" />
                            <div className="space-y-2 p-3">
                              <div className="h-4 w-3/4 animate-pulse rounded-md bg-stone-200" />
                              <div className="h-3 w-full animate-pulse rounded-md bg-stone-100" />
                              <div className="h-9 w-full animate-pulse rounded-lg bg-stone-100" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Accordion
                  type="single"
                  collapsible
                  value={openCategoryId}
                  onValueChange={(value) => setOpenCategoryId(value || undefined)}
                  className="grid gap-3"
                >
                  {menuCategories.map((category) => (
                    <AccordionItem key={category.id} value={category.id} className="overflow-hidden rounded-xl">
                      <AccordionTrigger>
                        <div className="min-w-0">
                          <p className="text-base font-semibold text-stone-950">{category.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-stone-400">
                            {category.items.length} options
                          </p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {category.description ? (
                          <p className="mb-4 text-sm text-stone-600">{category.description}</p>
                        ) : null}

                        {category.items.length === 0 ? (
                          <p className="text-sm text-stone-500">No drinks in this category yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                            {category.items.map((drink) => {
                              const cartItem = cartItems.find((item) => item.drinkId === drink.id);

                              return (
                                <div
                                  key={drink.id}
                                  className={`flex h-full flex-col overflow-hidden rounded-xl border transition ${
                                    cartItem
                                      ? "border-amber-500 bg-amber-50/50 ring-2 ring-amber-200"
                                      : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                                  }`}
                                >
                                  <div className="relative aspect-square overflow-hidden bg-stone-100">
                                    {drink.imageUrl ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img
                                        src={drink.imageUrl}
                                        alt={drink.name}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex h-full items-center justify-center text-stone-300">
                                        <ImageIcon className="size-8" />
                                      </div>
                                    )}
                                    {cartItem ? (
                                      <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-md bg-stone-950 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">
                                        <CheckIcon className="size-3" />
                                        x{cartItem.quantity}
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex flex-1 flex-col p-3">
                                    <div>
                                      <p className="line-clamp-2 min-h-10 text-sm font-semibold text-stone-950 sm:text-base">
                                        {drink.name}
                                      </p>
                                      <p className="mt-1 line-clamp-2 min-h-8 text-xs text-stone-500 sm:text-sm">
                                        {drink.description || "Freshly prepared at the bar."}
                                      </p>
                                    </div>

                                    <div className="mt-auto flex flex-col gap-2 pt-3 sm:flex-row sm:items-end sm:justify-between">
                                      <p className="text-sm font-semibold text-stone-950">
                                        {formatPrice(drink.price ?? null)}
                                      </p>
                                      <Button
                                        type="button"
                                        variant={cartItem ? "default" : "outline"}
                                        onClick={() => addToCart(category, drink)}
                                        disabled={isSubmitting}
                                        className={
                                          cartItem
                                            ? "w-full rounded-lg bg-stone-950 text-white hover:bg-stone-800 sm:w-auto"
                                            : "w-full rounded-lg border-stone-300 bg-white text-stone-700 hover:bg-stone-100 sm:w-auto"
                                        }
                                      >
                                        <PlusIcon className="size-4" />
                                        {cartItem ? "Add More" : "Add"}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </div>

            <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-stone-950">Cart summary</p>
                  <p className="mt-1 text-sm text-stone-500">
                    Open the cart drawer to edit quantities and notes.
                  </p>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                  {totalQuantity} items selected
                </p>
              </div>

              {cartItems.length === 0 ? (
                <p className="mt-4 text-sm text-stone-500">
                  Your cart is empty. Add a drink card to begin.
                </p>
              ) : (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="grid gap-1">
                    <p className="text-sm font-semibold text-stone-950">
                      {cartItems[0].drinkName}
                      {cartItems.length > 1 ? ` + ${cartItems.length - 1} more` : ""}
                    </p>
                    <p className="text-sm text-stone-500">
                      {totalAmount ? `Estimated total: INR ${totalAmount}` : "Some items are priced on request"}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCartOpen(true)}
                    className="rounded-lg border-stone-300 bg-white text-stone-700 hover:bg-stone-100"
                  >
                    <ShoppingCartIcon className="size-4" />
                    Open Cart
                  </Button>
                </div>
              )}
            </div>

            {menuError ? <p className="text-sm text-rose-600">{menuError}</p> : null}
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <Button
              type="submit"
              disabled={isSubmitting || isLoadingMenu || Boolean(menuError)}
              size="lg"
              className="mt-1 h-12 rounded-lg bg-stone-950 text-sm font-semibold text-white hover:bg-stone-800"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="text-white" />
                  Preparing...
                </span>
              ) : (
                "Review Order"
              )}
            </Button>

            <p className="text-center text-base font-semibold text-amber-700">
              Ask Mackanzie for other spirits with mixers or not.
            </p>
          </form>
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 px-4 py-3 shadow-[0_-10px_30px_rgba(40,26,20,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsCartOpen(true)}
            className="h-12 min-w-0 flex-1 rounded-lg border-stone-300 bg-white text-stone-800 hover:bg-stone-100"
          >
            <ShoppingCartIcon className="size-4" />
            <span className="truncate">
              {cartItems.length > 0 ? `Cart (${totalQuantity})` : "Open Cart"}
            </span>
          </Button>
          <Button
            type="button"
            onClick={() => {
              const form = document.getElementById("customer-order-form") as HTMLFormElement | null;
              form?.requestSubmit();
            }}
            disabled={isSubmitting || isLoadingMenu || Boolean(menuError) || cartItems.length === 0}
            className="h-12 min-w-0 flex-[1.2] rounded-lg bg-stone-950 text-white hover:bg-stone-800"
          >
            <span className="truncate">
              {cartItems.length > 0
                ? totalAmount
                  ? `Review • INR ${totalAmount}`
                  : `Review • ${totalQuantity} item(s)`
                : "Review Order"}
            </span>
          </Button>
        </div>
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-2xl rounded-xl border border-white/70 bg-white p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle className="text-2xl text-stone-950">Confirm order</DialogTitle>
            <DialogDescription className="text-sm text-stone-600">
              Double-check the full cart before sending it to the bar queue.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 px-6 pb-2">
            <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-stone-500">Customer</p>
                  <p className="font-semibold text-stone-900">{draft.customerName.trim()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-stone-500">Items</p>
                  <p className="font-semibold text-stone-900">{totalQuantity}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              {cartItems.map((item) => (
                <div key={item.drinkId} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-stone-950">
                        {item.drinkName} x{item.quantity}
                      </p>
                      <p className="text-sm text-stone-500">{item.categoryName}</p>
                      {item.notes.trim() ? (
                        <p className="mt-2 text-sm text-stone-600">Note: {item.notes.trim()}</p>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-stone-900">
                      {item.unitPrice ? `INR ${(Number(item.unitPrice) * item.quantity).toFixed(2)}` : "-"}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {totalAmount ? (
              <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-50 px-4 py-3">
                <p className="text-sm text-stone-500">Estimated total</p>
                <p className="text-base font-semibold text-stone-950">INR {totalAmount}</p>
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-stone-200 bg-stone-50/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              disabled={isSubmitting}
              className="rounded-lg"
            >
              Back
            </Button>
            <Button
              type="button"
              onClick={confirmOrder}
              disabled={isSubmitting}
              className="rounded-lg bg-stone-950 text-white hover:bg-stone-800"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Spinner className="text-white" />
                  Placing Order...
                </span>
              ) : (
                "Confirm Order"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
