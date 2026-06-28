import { AppHeader } from "@/components/shared/AppHeader";
import { AppShell } from "@/components/shared/AppShell";
import { CustomerOrderStatus } from "@/components/order/CustomerOrderStatus";

function withQr(path: string, locationQrSlug?: string) {
  if (!locationQrSlug) {
    return path;
  }

  return `${path}?qr=${encodeURIComponent(locationQrSlug)}`;
}

export default async function CustomerOrderStatusPage(props: PageProps<"/order/status">) {
  const searchParams = await props.searchParams;
  const qrValue = searchParams.qr;
  const locationQrSlug = typeof qrValue === "string" ? qrValue : undefined;

  return (
    <AppShell topSpacing="compact" variant="dark" contentClassName="max-w-6xl space-y-6 pb-8">
      <AppHeader
        activePath="/order/status"
        customerMenu={{
          orderHref: withQr("/order", locationQrSlug),
          ordersHref: withQr("/order/status", locationQrSlug),
        }}
      />
      <CustomerOrderStatus locationQrSlug={locationQrSlug} refreshKey={0} />
    </AppShell>
  );
}
