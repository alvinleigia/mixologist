import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canAccessRole, restaurantAdminRoles } from "@/lib/role-access";
import { getTenantAdminSnapshot } from "@/lib/tenant-admin";
import { getCurrentTenantContext } from "@/lib/tenant-context";

export async function requireRestaurantAdminPage() {
  const session = await auth();

  if (!session?.user?.role || !canAccessRole(session.user.role, restaurantAdminRoles)) {
    redirect("/staff/login");
  }

  try {
    const context = await getCurrentTenantContext();
    const snapshot = await getTenantAdminSnapshot(context);

    return { session, snapshot };
  } catch {
    redirect("/company");
  }
}
