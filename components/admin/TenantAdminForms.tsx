"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import type { MembershipRole } from "@/lib/staff-auth";

type StaffRole = Extract<MembershipRole, "RESTAURANT_MANAGER" | "ORDER_OPERATOR">;

const staffRoles: StaffRole[] = ["RESTAURANT_MANAGER", "ORDER_OPERATOR"];

type RestaurantSettings = {
  name: string;
  logoUrl: string | null;
  timezone: string;
  currency: string;
};

type LocationSettings = {
  name: string;
  label: string | null;
  qrSlug: string | null;
  timezone: string;
  isActive: boolean;
};

type StaffAccess = {
  membershipId: string;
  name: string;
  role: MembershipRole;
  isActive: boolean;
};

type StaffDraft = {
  username: string;
  name: string;
  email: string;
  password?: string;
  role: StaffRole;
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

async function submitJson(path: string, method: "POST" | "PATCH", body: unknown) {
  const response = await fetch(path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(getApiError(payload));
  }

  return payload;
}

function StaffRoleSelect({
  onChange,
  value,
}: {
  onChange: (role: StaffRole) => void;
  value: StaffRole;
}) {
  return (
    <Select value={value} onValueChange={(role) => onChange(role as StaffRole)}>
      <SelectTrigger className="bg-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {staffRoles.map((role) => (
          <SelectItem key={role} value={role}>
            {role.replaceAll("_", " ")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function FormActions({
  backHref = "/restaurant",
  isSaving,
  submitLabel,
}: {
  backHref?: string;
  isSaving: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <Button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-stone-950 text-white hover:bg-stone-800"
      >
        {isSaving ? "Saving..." : submitLabel}
      </Button>
      <Button asChild type="button" variant="outline" className="rounded-lg">
        <Link href={backHref}>Cancel</Link>
      </Button>
    </div>
  );
}

export function TenantRestaurantSettingsForm({
  organization,
}: {
  organization: RestaurantSettings;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: organization.name,
    logoUrl: organization.logoUrl ?? "",
    timezone: organization.timezone,
    currency: organization.currency,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    try {
      await submitJson("/api/tenant/admin/organization", "PATCH", draft);
      toast.success("Restaurant settings updated.");
      router.push("/restaurant");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed.";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <Card className="rounded-xl border-stone-200 bg-white">
      <CardHeader className="px-5 pt-5">
        <h3 className="text-2xl font-semibold text-stone-950">Edit restaurant</h3>
        <p className="text-sm text-stone-500">
          Update the current restaurant tenant details.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <FormField label="Name">
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FormField>
          <FormField label="Logo URL">
            <Input
              value={draft.logoUrl}
              onChange={(event) =>
                setDraft((current) => ({ ...current, logoUrl: event.target.value }))
              }
            />
          </FormField>
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
          <FormActions isSaving={isSaving} submitLabel="Save changes" />
        </form>
      </CardContent>
    </Card>
  );
}

export function TenantLocationSettingsForm({
  location,
}: {
  location: LocationSettings;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState({
    name: location.name,
    label: location.label ?? "",
    qrSlug: location.qrSlug ?? "",
    timezone: location.timezone,
    isActive: location.isActive,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    try {
      await submitJson("/api/tenant/admin/location", "PATCH", draft);
      toast.success("Location settings updated.");
      router.push("/restaurant");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed.";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <Card className="rounded-xl border-stone-200 bg-white">
      <CardHeader className="px-5 pt-5">
        <h3 className="text-2xl font-semibold text-stone-950">Edit location</h3>
        <p className="text-sm text-stone-500">
          Update the live operating location for this restaurant.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <FormField label="Name">
            <Input
              value={draft.name}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
            />
          </FormField>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Label">
              <Input
                value={draft.label}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, label: event.target.value }))
                }
              />
            </FormField>
            <FormField label="QR / menu slug">
              <Input
                value={draft.qrSlug}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    qrSlug: event.target.value.toLowerCase(),
                  }))
                }
              />
            </FormField>
          </div>
          <FormField label="Timezone">
            <Input
              value={draft.timezone}
              onChange={(event) =>
                setDraft((current) => ({ ...current, timezone: event.target.value }))
              }
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="size-4 rounded border-stone-300"
            />
            Location is active
          </label>
          <FormActions isSaving={isSaving} submitLabel="Save changes" />
        </form>
      </CardContent>
    </Card>
  );
}

export function TenantStaffInviteForm() {
  const [draft, setDraft] = useState<StaffDraft>({
    username: "",
    name: "",
    email: "",
    role: "ORDER_OPERATOR",
  });
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    try {
      const payload = await submitJson("/api/tenant/admin/staff/invite", "POST", draft);
      setInviteUrl(typeof payload.inviteUrl === "string" ? payload.inviteUrl : null);
      setDraft({ username: "", name: "", email: "", role: "ORDER_OPERATOR" });
      setError(null);
      toast.success("Invite created.");
      setIsSaving(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed.";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <StaffDetailsForm
      draft={draft}
      error={error}
      inviteUrl={inviteUrl}
      isSaving={isSaving}
      onChange={setDraft}
      onSubmit={save}
      submitLabel="Create invite"
      title="Invite staff"
    />
  );
}

export function TenantStaffCreateForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<StaffDraft>({
    username: "",
    name: "",
    email: "",
    password: "",
    role: "ORDER_OPERATOR",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    try {
      await submitJson("/api/tenant/admin/staff", "POST", draft);
      toast.success("Staff user created.");
      router.push("/restaurant");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed.";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <StaffDetailsForm
      draft={draft}
      error={error}
      isSaving={isSaving}
      onChange={setDraft}
      onSubmit={save}
      showPassword
      submitLabel="Add staff"
      title="Add staff"
    />
  );
}

function StaffDetailsForm({
  draft,
  error,
  inviteUrl,
  isSaving,
  onChange,
  onSubmit,
  showPassword = false,
  submitLabel,
  title,
}: {
  draft: StaffDraft;
  error: string | null;
  inviteUrl?: string | null;
  isSaving: boolean;
  onChange: (draft: StaffDraft) => void;
  onSubmit: () => Promise<void>;
  showPassword?: boolean;
  submitLabel: string;
  title: string;
}) {
  return (
    <Card className="rounded-xl border-stone-200 bg-white">
      <CardHeader className="px-5 pt-5">
        <h3 className="text-2xl font-semibold text-stone-950">{title}</h3>
        <p className="text-sm text-stone-500">
          Staff created here is assigned to this restaurant location.
        </p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit();
          }}
        >
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Username">
              <Input
                value={draft.username}
                onChange={(event) =>
                  onChange({ ...draft, username: event.target.value })
                }
              />
            </FormField>
            <FormField label="Name">
              <Input
                value={draft.name}
                onChange={(event) => onChange({ ...draft, name: event.target.value })}
              />
            </FormField>
            <FormField label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(event) => onChange({ ...draft, email: event.target.value })}
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {showPassword ? (
              <FormField label="Password">
                <Input
                  type="password"
                  value={draft.password ?? ""}
                  onChange={(event) =>
                    onChange({ ...draft, password: event.target.value })
                  }
                />
              </FormField>
            ) : null}
            <FormField label="Role">
              <StaffRoleSelect
                value={draft.role}
                onChange={(role) => onChange({ ...draft, role })}
              />
            </FormField>
          </div>
          <FormActions isSaving={isSaving} submitLabel={submitLabel} />
        </form>
        {inviteUrl ? (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="break-all text-sm text-stone-700">{inviteUrl}</p>
            <Button
              type="button"
              variant="outline"
              className="mt-3 rounded-lg bg-white"
              onClick={() => {
                void navigator.clipboard.writeText(inviteUrl);
                toast.success("Invite link copied.");
              }}
            >
              Copy Link
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function TenantStaffAccessForm({ staff }: { staff: StaffAccess }) {
  const router = useRouter();
  const initialRole =
    staff.role === "ORDER_OPERATOR" ? "ORDER_OPERATOR" : "RESTAURANT_MANAGER";
  const [draft, setDraft] = useState<{ role: StaffRole; isActive: boolean }>({
    role: initialRole,
    isActive: staff.isActive,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setIsSaving(true);
    try {
      await submitJson(`/api/tenant/admin/staff/${staff.membershipId}`, "PATCH", draft);
      toast.success("Staff access updated.");
      router.push("/restaurant");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed.";
      setError(message);
      toast.error(message);
      setIsSaving(false);
    }
  }

  return (
    <Card className="rounded-xl border-stone-200 bg-white">
      <CardHeader className="px-5 pt-5">
        <h3 className="text-2xl font-semibold text-stone-950">Edit staff access</h3>
        <p className="text-sm text-stone-500">{staff.name}</p>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
          <FormField label="Role">
            <StaffRoleSelect
              value={draft.role}
              onChange={(role) => setDraft((current) => ({ ...current, role }))}
            />
          </FormField>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={draft.isActive}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="size-4 rounded border-stone-300"
            />
            Staff access is active
          </label>
          <FormActions isSaving={isSaving} submitLabel="Save changes" />
        </form>
      </CardContent>
    </Card>
  );
}
