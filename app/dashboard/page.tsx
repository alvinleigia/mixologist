import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getHomePathForRole } from "@/lib/role-access";

export default async function DashboardRedirectPage() {
  const session = await auth();

  if (!session?.user?.role) {
    redirect("/staff/login");
  }

  redirect(getHomePathForRole(session.user.role));
}
