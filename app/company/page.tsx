import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AuditLogPanel } from "@/components/admin/AuditLogPanel";
import { CompanyRestaurantsPanel } from "@/components/admin/CompanyRestaurantsPanel";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { isDefaultCompanyOrganizationId } from "@/lib/tenant-defaults";

export default async function CompanyPage() {
  const session = await auth();

  if (!session?.user?.role || !canAccessRole(session.user.role, companyAdminRoles)) {
    redirect("/staff/login");
  }

  return (
    <SaasAdminShell
      activePath="/company"
      eyebrow="Company"
      title="Company dashboard"
      description="Manage restaurants and view cross-restaurant summaries for the selected parent company."
      user={{
        name: session.user.name,
        organizationId: session.user.organizationId,
        role: session.user.role,
      }}
    >
      <CompanyRestaurantsPanel
        hasRealCompanyContext={!isDefaultCompanyOrganizationId(session.user.organizationId)}
      />
      {!isDefaultCompanyOrganizationId(session.user.organizationId) ? (
        <div className="mt-6">
          <AuditLogPanel />
        </div>
      ) : null}
    </SaasAdminShell>
  );
}
