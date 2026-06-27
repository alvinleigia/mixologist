import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CreateRestaurantForm } from "@/components/admin/CreateRestaurantForm";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { isDefaultCompanyOrganizationId } from "@/lib/tenant-defaults";

export default async function NewCompanyRestaurantPage() {
  const session = await auth();

  if (
    !session?.user?.role ||
    !session.user.organizationId ||
    !canAccessRole(session.user.role, companyAdminRoles) ||
    isDefaultCompanyOrganizationId(session.user.organizationId)
  ) {
    redirect("/staff/login");
  }

  return (
    <SaasAdminShell
      activePath="/company"
      eyebrow="Company"
      title="Add restaurant"
      description="Create a child restaurant and its first operational location."
      user={{ name: session.user.name, role: session.user.role }}
    >
      <CreateRestaurantForm />
    </SaasAdminShell>
  );
}
