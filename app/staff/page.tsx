import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { LocationSwitcher } from "@/components/admin/LocationSwitcher";
import { StaffOperationsWorkspace } from "@/components/staff/StaffOperationsWorkspace";
import { AppHeader } from "@/components/shared/AppHeader";
import { AppShell } from "@/components/shared/AppShell";
import { canAccessRole, operationalRoles } from "@/lib/role-access";

export default async function StaffPage() {
  const session = await auth();

  if (!session?.user?.role || !canAccessRole(session.user.role, operationalRoles)) {
    redirect("/staff/login");
  }

  return (
    <AppShell variant="dark">
      <AppHeader
        activePath="/staff"
        user={{ name: session.user.name, role: session.user.role }}
      />
      <div className="mb-6 flex justify-end">
        <LocationSwitcher />
      </div>
      <StaffOperationsWorkspace
        hasLocationAccess={Boolean(session.user.organizationId && session.user.locationId)}
      />
    </AppShell>
  );
}
