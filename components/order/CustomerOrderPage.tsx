"use client";

import { OrderForm } from "@/components/order/OrderForm";
import { AppHeader } from "@/components/shared/AppHeader";
import type { MembershipRole } from "@/lib/staff-auth";

type CustomerOrderPageProps = {
  locationQrSlug?: string;
  user?: {
    name?: string | null;
    role: MembershipRole;
  } | null;
};

function withQr(path: string, locationQrSlug?: string) {
  if (!locationQrSlug) {
    return path;
  }

  return `${path}?qr=${encodeURIComponent(locationQrSlug)}`;
}

export function CustomerOrderPage({ locationQrSlug, user }: CustomerOrderPageProps) {
  return (
    <>
      {user ? (
        <AppHeader activePath="/order" user={user} />
      ) : (
        <AppHeader
          activePath="/order"
          customerMenu={{
            orderHref: withQr("/order", locationQrSlug),
            ordersHref: withQr("/order/status", locationQrSlug),
          }}
        />
      )}

      <OrderForm locationQrSlug={locationQrSlug} />
    </>
  );
}
