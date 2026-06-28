import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { LocationStaffPanel } from "@/components/admin/LocationStaffPanel";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { getCompanyRestaurant } from "@/lib/saas-admin";

export default async function CompanyRestaurantLocationStaffPage(
  props: PageProps<"/company/restaurants/[id]/locations/[locationId]/staff">,
) {
  const session = await auth();

  if (
    !session?.user?.role ||
    !session.user.organizationId ||
    !canAccessRole(session.user.role, companyAdminRoles)
  ) {
    redirect("/staff/login");
  }

  const { id, locationId } = await props.params;
  const restaurant = await getCompanyRestaurant(session.user.organizationId, id);

  if (!restaurant) {
    notFound();
  }

  const location = restaurant.locations?.find((item) => item.id === locationId);

  if (!location) {
    notFound();
  }

  return (
    <SaasAdminShell
      activePath="/company"
      eyebrow="Company"
      title={`${location.name} staff`}
      description={`Manage staff access for ${restaurant.name}.`}
      user={{
        name: session.user.name,
        organizationId: session.user.organizationId,
        role: session.user.role,
      }}
    >
      <LocationStaffPanel
        backHref={`/company/restaurants/${restaurant.id}/locations`}
        locationId={location.id}
        locationName={location.name}
        restaurantId={restaurant.id}
      />
    </SaasAdminShell>
  );
}
