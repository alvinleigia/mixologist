import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CommercialAccessBlocked } from "@/components/admin/CommercialAccessBlocked";
import { LocationSwitcher } from "@/components/admin/LocationSwitcher";
import { InventoryManager } from "@/components/staff/InventoryManager";
import { OperationsSetupRequired } from "@/components/staff/OperationsSetupRequired";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppShell } from "@/components/shared/AppShell";
import { getTenantSubscriptionAccess } from "@/lib/billing";
import { canAccessRole, restaurantAdminRoles } from "@/lib/role-access";

export default async function OperationsInventoryPage() {
  const session = await auth();

  if (!session?.user?.role || !canAccessRole(session.user.role, restaurantAdminRoles)) {
    redirect("/staff/login");
  }

  const hasLocationAccess = Boolean(
    session.user.organizationId && session.user.locationId,
  );
  const commercialAccess = session.user.organizationId
    ? await getTenantSubscriptionAccess(session.user.organizationId)
    : { allowed: true, status: null };

  return (
    <AppShell variant="dark">
      <AppHeader
        activePath="/operations/inventory"
        user={{ name: session.user.name, role: session.user.role }}
      />
      <div className="mb-6 flex justify-end">
        <LocationSwitcher />
      </div>
      {!commercialAccess.allowed ? (
        <CommercialAccessBlocked status={commercialAccess.status} />
      ) : hasLocationAccess ? (
        <InventoryManager />
      ) : (
        <OperationsSetupRequired />
      )}
    </AppShell>
  );
}
