import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { MixologistLoginForm } from "@/components/mixologist/MixologistLoginForm";
import { AppShell } from "@/components/shared/AppShell";
import { Card, CardContent } from "@/components/ui/card";

export default async function MixologistLoginPage() {
  const session = await auth();

  if (session?.user?.role === "MIXOLOGIST") {
    redirect("/mixologist");
  }

  return (
    <AppShell variant="dark" contentClassName="grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="rounded-[2.5rem] border-white/10 bg-white/5 text-white shadow-[0_30px_80px_rgba(0,0,0,0.18)]">
          <CardContent className="p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-amber-300">
            Mixologist Access
          </p>
          <h2 className="mt-5 text-5xl font-semibold tracking-tight text-white">
            Keep the staff board behind a simple login.
          </h2>
          <p className="mt-6 max-w-xl text-lg leading-8 text-stone-300">
            This uses Auth.js beta credentials auth for an MVP-friendly username and
            password flow without building a full admin system yet.
          </p>
          </CardContent>
        </Card>

        <MixologistLoginForm />
    </AppShell>
  );
}
