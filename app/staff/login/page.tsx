import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { StaffLoginForm } from "@/components/staff/StaffLoginForm";
import { AppShell } from "@/components/shared/AppShell";
import { getHomePathForRole } from "@/lib/role-access";

export default async function StaffLoginPage() {
  const session = await auth();

  if (session?.user?.role) {
    redirect(getHomePathForRole(session.user.role));
  }

  return (
    <AppShell
      variant="dark"
      contentClassName="flex min-h-[calc(100vh-5rem)] items-center justify-center"
    >
      <div className="w-full max-w-xl">
        <StaffLoginForm />
      </div>
    </AppShell>
  );
}
