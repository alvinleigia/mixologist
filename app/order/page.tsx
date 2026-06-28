import { auth } from "@/auth";
import { CustomerOrderPage } from "@/components/order/CustomerOrderPage";
import { AppShell } from "@/components/shared/AppShell";

async function getOptionalUser() {
  try {
    const session = await auth();

    if (!session?.user?.role) {
      return null;
    }

    return {
      name: session.user.name,
      role: session.user.role,
    };
  } catch {
    return null;
  }
}

export default async function OrderPage(props: PageProps<"/order">) {
  const searchParams = await props.searchParams;
  const qrValue = searchParams.qr;
  const locationQrSlug = typeof qrValue === "string" ? qrValue : undefined;
  const user = await getOptionalUser();

  return (
    <AppShell topSpacing="compact" variant="dark" contentClassName="max-w-6xl space-y-6 pb-8">
      <CustomerOrderPage locationQrSlug={locationQrSlug} user={user} />
    </AppShell>
  );
}
