import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { PlatformCompaniesPanel } from "@/components/admin/PlatformCompaniesPanel";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, platformAdminRoles } from "@/lib/role-access";

export default async function PlatformPage() {
  const session = await auth();

  if (!session?.user?.role || !canAccessRole(session.user.role, platformAdminRoles)) {
    redirect("/staff/login");
  }

  return (
    <SaasAdminShell
      activePath="/platform"
      eyebrow="Platform"
      title="Platform control"
      description="Create parent companies and monitor platform-wide health."
      user={{ name: session.user.name, role: session.user.role }}
    >
      <PlatformCompaniesPanel />
    </SaasAdminShell>
  );
}
