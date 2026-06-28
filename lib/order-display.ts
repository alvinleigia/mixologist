type OrderDisplayInput = {
  createdAt?: string | null;
  orderDate?: string | null;
  orderNo: number;
};

function todayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function formatOrderNumber(orderNo: number) {
  return `Order #${orderNo}`;
}

export function formatOrderDateLabel(orderDate?: string | null) {
  if (!orderDate) {
    return null;
  }

  if (orderDate === todayIsoDate()) {
    return "Today";
  }

  const parsed = new Date(`${orderDate}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return orderDate;
  }

  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatOrderDisplay(input: OrderDisplayInput) {
  const dateLabel = formatOrderDateLabel(input.orderDate);

  return {
    dateLabel,
    label: formatOrderNumber(input.orderNo),
    meta: dateLabel ?? (input.createdAt ? new Date(input.createdAt).toLocaleDateString() : null),
  };
}
