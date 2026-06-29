import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import {
  canAccessRole,
  companyAdminRoles,
  platformAdminRoles,
  restaurantAdminRoles,
} from "@/lib/role-access";

const auditLogRoles = [
  ...platformAdminRoles,
  ...companyAdminRoles,
  ...restaurantAdminRoles,
];

export default async function AuditLogsPage() {
  const session = await auth();

  if (!session?.user?.role || !canAccessRole(session.user.role, auditLogRoles)) {
    redirect("/staff/login");
  }

  return (
    <SaasAdminShell
      activePath="/audit-logs"
      eyebrow="Security"
      title="Audit logs"
      description="Review scoped admin, menu, inventory and order changes from one dedicated view."
      user={{
        name: session.user.name,
        organizationId: session.user.organizationId,
        role: session.user.role,
      }}
    >
      <AuditLogPanel />
    </SaasAdminShell>
  );
}
