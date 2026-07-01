import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CommercialAccessBlocked } from "@/components/admin/CommercialAccessBlocked";
import { LocationSwitcher } from "@/components/admin/LocationSwitcher";
import { OperationsSetupRequired } from "@/components/staff/OperationsSetupRequired";
import { StaffOrderBoard } from "@/components/staff/StaffOrderBoard";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppShell } from "@/components/shared/AppShell";
import { getTenantSubscriptionAccess } from "@/lib/billing";
import { isSessionAccessAllowedForCurrentDomain } from "@/lib/domain-session";
import { canAccessRole, operationalRoles } from "@/lib/role-access";

export default async function OperationsOrdersPage() {
  const session = await auth();

  if (!session?.user?.role || !canAccessRole(session.user.role, operationalRoles)) {
    redirect("/staff/login");
  }

  if (!(await isSessionAccessAllowedForCurrentDomain(session.user))) {
    redirect("/dashboard");
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
        activePath="/operations/orders"
        user={{ name: session.user.name, role: session.user.role }}
      />
      <div className="mb-6 flex justify-end">
        <LocationSwitcher />
      </div>
      {!commercialAccess.allowed ? (
        <CommercialAccessBlocked status={commercialAccess.status} />
      ) : hasLocationAccess ? (
        <StaffOrderBoard />
      ) : (
        <OperationsSetupRequired />
      )}
    </AppShell>
  );
}
