"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const emptyRestaurantDraft = {
  name: "",
  timezone: "Asia/Calcutta",
  currency: "INR",
  locationName: "",
  locationLabel: "",
};

function getApiError(payload: unknown) {
  if (payload && typeof payload === "object" && "error" in payload) {
    const error = (payload as { error?: unknown }).error;

    if (typeof error === "string") {
      return error;
    }
  }

  return "Action failed.";
}

export function CreateRestaurantForm() {
  const router = useRouter();
  const [draft, setDraft] = useState(emptyRestaurantDraft);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitRestaurant() {
    setIsSubmitting(true);
    const response = await fetch("/api/company/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const payload = await response.json();

    if (!response.ok) {
      const message = getApiError(payload);
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    toast.success("Restaurant created.");
    router.push("/company");
    router.refresh();
  }

  return (
    <Card className="rounded-xl border-stone-200 bg-white">
      <CardHeader className="px-5 pt-5">
        <h3 className="text-2xl font-semibold text-stone-950">Add restaurant</h3>
        <p className="text-sm text-stone-500">
          Create the restaurant and its first operational location.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void submitRestaurant();
          }}
        >
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <FormField label="Restaurant name">
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="First location name">
              <Input
                value={draft.locationName}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    locationName: event.target.value,
                  }))
                }
              />
            </FormField>
            <FormField label="First location label">
              <Input
                value={draft.locationLabel}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    locationLabel: event.target.value,
                  }))
                }
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Timezone">
              <Input
                value={draft.timezone}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, timezone: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Currency">
              <Input
                value={draft.currency}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, currency: event.target.value }))
                }
              />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-stone-950 text-white hover:bg-stone-800"
            >
              {isSubmitting ? "Creating..." : "Create restaurant"}
            </Button>
            <Button asChild type="button" variant="outline" className="rounded-lg">
              <Link href="/company">Cancel</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
