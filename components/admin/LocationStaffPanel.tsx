"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type LocationStaffPanelProps = {
  backHref: string;
  locationId: string;
  locationName: string;
  restaurantId: string;
};

const emptyStaffDraft = {
  username: "",
  name: "",
  email: "",
  role: "RESTAURANT_MANAGER",
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

export function LocationStaffPanel({
  backHref,
  locationId,
  locationName,
  restaurantId,
}: LocationStaffPanelProps) {
  const [draft, setDraft] = useState(emptyStaffDraft);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitStaffInvite() {
    setIsSubmitting(true);
    const response = await fetch(
      `/api/company/restaurants/${restaurantId}/locations/${locationId}/staff`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      },
    );
    const payload = await response.json();

    if (!response.ok) {
      const message = getApiError(payload);
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
      return;
    }

    setDraft(emptyStaffDraft);
    setError(null);
    setInviteUrl(typeof payload.inviteUrl === "string" ? payload.inviteUrl : null);
    setIsSubmitting(false);
    toast.success("Invite link created.");
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <Card className="rounded-xl border-stone-200 bg-white">
        <CardHeader className="px-5 pt-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
            {locationName}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-stone-950">
            Staff access
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Invite a manager or operator specifically to this location.
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form
            className="grid gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitStaffInvite();
            }}
          >
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <FormField label="Username">
              <Input
                value={draft.username}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, username: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Name">
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, email: event.target.value }))
                }
              />
            </FormField>
            <FormField label="Role">
              <Select
                value={draft.role}
                onValueChange={(role) => setDraft((current) => ({ ...current, role }))}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESTAURANT_MANAGER">Restaurant Manager</SelectItem>
                  <SelectItem value="ORDER_OPERATOR">Order Operator</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-stone-950 text-white hover:bg-stone-800"
              >
                {isSubmitting ? "Creating..." : "Create invite"}
              </Button>
              <Button asChild type="button" variant="outline" className="rounded-lg">
                <Link href={backHref}>Back to locations</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-stone-200 bg-white">
        <CardHeader className="px-5 pt-5">
          <h3 className="text-xl font-semibold text-stone-950">Invite link</h3>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          {inviteUrl ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="break-all text-sm text-stone-700">{inviteUrl}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3 rounded-lg border-amber-300 bg-white text-stone-900"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl);
                  toast.success("Invite link copied.");
                }}
              >
                Copy Link
              </Button>
            </div>
          ) : (
            <p className="text-sm leading-6 text-stone-600">
              Create an invite and the one-time acceptance link will appear here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
