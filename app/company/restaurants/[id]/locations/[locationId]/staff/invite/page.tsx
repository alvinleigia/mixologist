import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { StaffInviteForm } from "@/components/admin/StaffInviteForm";
import { canAccessRole, companyAdminRoles } from "@/lib/role-access";
import { getCompanyRestaurant } from "@/lib/saas-admin";

export default async function CompanyRestaurantLocationStaffInvitePage(
  props: PageProps<"/company/restaurants/[id]/locations/[locationId]/staff/invite">,
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

  const staffHref = `/company/restaurants/${restaurant.id}/locations/${location.id}/staff`;
  const assignHref = `/company/users/reassign?restaurantId=${restaurant.id}&locationId=${location.id}&role=ORDER_OPERATOR&returnTo=${encodeURIComponent(staffHref)}`;

  return (
    <SaasAdminShell
      activePath="/company"
      eyebrow="Company"
      title="Invite staff"
      description={`Create a one-time invite link for ${location.name}.`}
      user={{
        name: session.user.name,
        organizationId: session.user.organizationId,
        role: session.user.role,
      }}
    >
      <StaffInviteForm
        apiPath={`/api/company/restaurants/${restaurant.id}/locations/${location.id}/staff`}
        assignExistingHref={assignHref}
        backHref={staffHref}
        defaultRole="RESTAURANT_MANAGER"
        description={`Invite a manager or operator specifically to ${location.name}.`}
        roles={[
          { label: "Restaurant Manager", value: "RESTAURANT_MANAGER" },
          { label: "Order Operator", value: "ORDER_OPERATOR" },
        ]}
        title="Invite staff"
      />
    </SaasAdminShell>
  );
}
