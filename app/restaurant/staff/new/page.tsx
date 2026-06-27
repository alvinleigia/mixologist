import { SaasAdminShell } from "@/components/admin/SaasAdminShell";
import { TenantStaffCreateForm } from "@/components/admin/TenantAdminForms";
import { requireRestaurantAdminPage } from "@/lib/restaurant-admin-page";

export default async function RestaurantStaffNewPage() {
  const { session } = await requireRestaurantAdminPage();

  return (
    <SaasAdminShell
      activePath="/restaurant"
      eyebrow="Staff"
      title="Add staff"
      description="Create a staff user directly for this restaurant location."
      user={{ name: session.user.name, role: session.user.role }}
    >
      <TenantStaffCreateForm />
    </SaasAdminShell>
  );
}
