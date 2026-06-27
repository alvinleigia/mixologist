import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { RestaurantLocationsPanel } from "@/components/admin/RestaurantLocationsPanel";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { getCompanyRestaurant } from "@/lib/saas-admin";

export default async function CompanyRestaurantLocationsPage(
  props: PageProps<"/company/restaurants/[id]/locations">,
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
      title={`${restaurant.name} locations`}
      description="Manage branches, counters and service points for this restaurant."
      user={{ name: session.user.name, role: session.user.role }}
    >
      <RestaurantLocationsPanel
        locations={restaurant.locations ?? []}
        restaurantId={restaurant.id}
      />
    </SaasAdminShell>
  );
}
