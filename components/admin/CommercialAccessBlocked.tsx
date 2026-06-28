import { Card, CardContent } from "@/components/ui/card";

type CommercialAccessBlockedProps = {
  status?: string | null;
};

export function CommercialAccessBlocked({ status }: CommercialAccessBlockedProps) {
  return (
    <Card className="rounded-xl border-rose-200 bg-rose-50">
      <CardContent className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
          Subscription suspended
        </p>
        <h3 className="mt-3 text-2xl font-semibold text-stone-950">
          Tenant access is currently blocked
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
          This company subscription is {status?.toLowerCase() ?? "not active"}.
          Please contact the SaaS platform owner to reactivate access.
        </p>
      </CardContent>
    </Card>
  );
}
