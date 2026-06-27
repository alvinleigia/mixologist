import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { CreateLocationForm } from "@/components/admin/CreateLocationForm";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { getCompanyRestaurant } from "@/lib/saas-admin";

export default async function NewCompanyRestaurantLocationPage(
  props: PageProps<"/company/restaurants/[id]/locations/new">,
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

  const backHref = `/company/restaurants/${restaurant.id}/locations`;

  return (
    <SaasAdminShell
      activePath="/company"
      eyebrow="Company"
      title={`Add location to ${restaurant.name}`}
      description="Create a branch, counter or service point for this restaurant."
      user={{ name: session.user.name, role: session.user.role }}
    >
      <CreateLocationForm backHref={backHref} restaurantId={restaurant.id} />
    </SaasAdminShell>
  );
}
