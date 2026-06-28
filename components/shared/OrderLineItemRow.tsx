import { ReactNode } from "react";

import { OrderStatusBadge } from "@/components/shared/OrderStatusBadge";
import { OrderItemStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

type OrderLineItemRowProps = {
  actions?: ReactNode;
  categoryName?: string | null;
  className?: string;
  drinkName: string;
  notes?: string | null;
  quantity: number;
  status?: OrderItemStatus;
  unitPrice?: string | null;
};

function formatLinePrice(unitPrice: string | null | undefined, quantity: number) {
  if (!unitPrice) {
    return null;
  }

  return `INR ${(Number(unitPrice) * quantity).toFixed(2)}`;
}

export function OrderLineItemRow({
  actions,
  categoryName,
  className,
  drinkName,
  notes,
  quantity,
  status,
  unitPrice,
}: OrderLineItemRowProps) {
  const linePrice = formatLinePrice(unitPrice, quantity);

  return (
    <div
      className={cn(
        "rounded-lg border border-stone-200 bg-white px-3 py-3",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-900">
            {drinkName} x{quantity}
          </p>
          {categoryName ? (
            <p className="text-xs text-stone-500">{categoryName}</p>
          ) : null}
          {notes ? (
            <p className="mt-1 text-xs text-stone-500">Note: {notes}</p>
          ) : null}
        </div>

        {status || linePrice ? (
          <div className="flex flex-col items-end gap-2">
            {status ? <OrderStatusBadge status={status} /> : null}
            {linePrice ? (
              <p className="text-xs font-semibold text-stone-700">{linePrice}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {actions ? <div className="mt-3 flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
