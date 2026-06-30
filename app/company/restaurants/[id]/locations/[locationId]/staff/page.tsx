import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { LocationStaffPanel } from "@/components/admin/LocationStaffPanel";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { getCompanyRestaurant, listCompanyUserMemberships } from "@/lib/saas-admin";

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

  const currentHref = `/company/restaurants/${restaurant.id}/locations/${location.id}/staff`;
  const staff = (await listCompanyUserMemberships(session.user.organizationId)).filter(
    (user) => user.locationId === location.id,
  );

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
        assignHref={`/company/users/reassign?restaurantId=${restaurant.id}&locationId=${location.id}&role=ORDER_OPERATOR&returnTo=${encodeURIComponent(currentHref)}`}
        backHref={`/company/restaurants/${restaurant.id}/locations`}
        currentHref={currentHref}
        inviteHref={`${currentHref}/invite`}
        locationName={location.name}
        staff={staff}
      />
    </SaasAdminShell>
  );
}
