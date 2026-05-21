import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MixologistLoginForm } from "@/components/mixologist/MixologistLoginForm";
import { AppShell } from "@/components/shared/AppShell";

export default async function MixologistLoginPage() {
  const session = await auth();

  if (session?.user?.role === "MIXOLOGIST") {
    redirect("/mixologist");
  }

  return (
    <AppShell
      variant="dark"
      contentClassName="flex min-h-[calc(100vh-5rem)] items-center justify-center"
    >
      <div className="w-full max-w-xl">
        <MixologistLoginForm />
      </div>
    </AppShell>
  );
}
