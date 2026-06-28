import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrganizationEditPanel } from "@/components/admin/OrganizationEditPanel";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { getCompanyRestaurant } from "@/lib/saas-admin";

export default async function CompanyRestaurantEditPage(
  props: PageProps<"/company/restaurants/[id]">,
) {
  const session = await auth();

  if (
    !session?.user?.role ||
    !session.user.organizationId ||
    !canAccessRole(session.user.role, companyAdminRoles)
  ) {
    redirect("/staff/login");
  }

  const { id } = await props.params;
  const restaurant = await getCompanyRestaurant(session.user.organizationId, id);

  if (!restaurant) {
    notFound();
  }

  return (
    <SaasAdminShell
      activePath="/company"
      eyebrow="Company"
      title="Restaurant settings"
      description="Edit restaurant tenant details and lifecycle status."
      user={{
        name: session.user.name,
        organizationId: session.user.organizationId,
        role: session.user.role,
      }}
    >
      <OrganizationEditPanel
        apiPath={`/api/company/restaurants/${restaurant.id}`}
        backHref="/company"
        entityLabel="Restaurant"
        organization={restaurant}
      />
    </SaasAdminShell>
  );
}
