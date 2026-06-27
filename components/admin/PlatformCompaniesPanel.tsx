"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MoreHorizontalIcon } from "lucide-react";
import { toast } from "sonner";

import { FormField } from "@/components/shared/FormField";
import { Spinner } from "@/components/shared/Spinner";
import {
  ReportBreakdown,
  type ReportBreakdownRow,
} from "@/components/admin/ReportBreakdown";
import { SummaryCards } from "@/components/admin/SummaryCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CompanyOrganization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  isActive: boolean;
};

type PlatformSummary = {
  companyTenants: number;
  restaurantTenants: number;
  activeLocations: number;
  activeStaffMemberships: number;
  activeOrders: number;
  completedOrders: number;
};

type PlatformReport = ReportBreakdownRow & {
  childRestaurants: number;
};

const emptyCompanyDraft = {
  name: "",
  timezone: "Asia/Calcutta",
  currency: "INR",
};

const emptyStaffDraft = {
  username: "",
  name: "",
  email: "",
  role: "COMPANY_OWNER",
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

export function PlatformCompaniesPanel() {
  const [companies, setCompanies] = useState<CompanyOrganization[]>([]);
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [breakdown, setBreakdown] = useState<PlatformReport[]>([]);
  const [draft, setDraft] = useState(emptyCompanyDraft);
  const [staffDrafts, setStaffDrafts] = useState<Record<string, typeof emptyStaffDraft>>({});
  const [inviteUrls, setInviteUrls] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  async function refreshPlatformSummary() {
    const summaryResponse = await fetch("/api/platform/summary");

    if (!summaryResponse.ok) {
      return;
    }

    const summaryPayload = await summaryResponse.json();
    setSummary(summaryPayload.summary ?? null);
    setBreakdown(summaryPayload.breakdown ?? []);
  }

  useEffect(() => {
    async function loadCompanies() {
      const companiesResponse = await fetch("/api/platform/companies");
      const payload = await companiesResponse.json();

      if (!companiesResponse.ok) {
        setError(getApiError(payload));
        setIsLoading(false);
        return;
      }

      setCompanies(payload.companies ?? []);
      await refreshPlatformSummary();

      setError(null);
      setIsLoading(false);
    }

    void loadCompanies();
  }, []);

  async function submitJson(path: string, body: unknown, action: string) {
    setPendingAction(action);
    const response = await fetch(path, {
      method: path === "/api/platform/companies" || path.endsWith("/staff") ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();

    if (!response.ok) {
      const message = getApiError(payload);
      setError(message);
      toast.error(message);
      setPendingAction(null);
      return;
    }

    setCompanies(payload.companies ?? []);
    await refreshPlatformSummary();
    setDraft(emptyCompanyDraft);
    if (typeof payload.inviteUrl === "string") {
      const companyId = action.replace("staff:", "");
      setInviteUrls((current) => ({ ...current, [companyId]: payload.inviteUrl }));
      setStaffDrafts((current) => ({ ...current, [companyId]: emptyStaffDraft }));
    }
    setError(null);
    setPendingAction(null);
    toast.success(payload.inviteUrl ? "Invite link created." : "Companies updated.");
  }

  function getStaffDraft(companyId: string) {
    return staffDrafts[companyId] ?? emptyStaffDraft;
  }

  function updateStaffDraft(
    companyId: string,
    patch: Partial<typeof emptyStaffDraft>,
  ) {
    setStaffDrafts((current) => ({
      ...current,
      [companyId]: {
        ...getStaffDraft(companyId),
        ...patch,
      },
    }));
  }

  return (
    <div className="grid gap-6">
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {summary ? (
        <SummaryCards
          cards={[
            {
              label: "Companies",
              value: summary.companyTenants,
              helper: "Parent company tenants.",
            },
            {
              label: "Restaurants",
              value: summary.restaurantTenants,
              helper: "Child restaurant tenants across the platform.",
            },
            {
              label: "Active orders",
              value: summary.activeOrders,
              helper: "Pending, preparing or ready orders.",
            },
            {
              label: "Locations",
              value: summary.activeLocations,
              helper: "Active restaurant locations.",
            },
            {
              label: "Staff memberships",
              value: summary.activeStaffMemberships,
              helper: "Active user assignments.",
            },
            {
              label: "Non-cancelled orders",
              value: summary.completedOrders,
              helper: "All-time orders excluding cancellations.",
            },
          ]}
        />
      ) : null}

      <ReportBreakdown
        title="Company activity"
        description="Compare parent companies by restaurants, locations, staff and order activity."
        emptyMessage="No company activity to report yet."
        rows={breakdown}
        showChildRestaurants
      />

      <Card className="rounded-xl border-stone-200 bg-white">
        <CardHeader className="px-5 pt-5">
          <h3 className="text-xl font-semibold text-stone-950">Create parent company</h3>
          <p className="text-sm text-stone-500">
            Parent companies can later manage their child restaurants and reporting.
          </p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form
            className="grid gap-3 md:grid-cols-[1.5fr_1fr_0.7fr_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void submitJson("/api/platform/companies", draft, "create");
            }}
          >
            <FormField label="Company name">
              <Input
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, name: event.target.value }))
                }
              />
            </FormField>
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
            <Button
              type="submit"
              disabled={Boolean(pendingAction)}
              className="mt-auto rounded-lg bg-stone-950 text-white hover:bg-stone-800"
            >
              {pendingAction === "create" ? "Creating..." : "Create"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-stone-200 bg-white">
        <CardHeader className="px-5 pt-5">
          <h3 className="text-xl font-semibold text-stone-950">Parent companies</h3>
        </CardHeader>
        <CardContent className="grid gap-3 px-5 pb-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-stone-500">
              <Spinner className="text-stone-500" />
              Loading companies...
            </div>
          ) : null}

          {!isLoading && companies.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-200 p-4 text-sm text-stone-500">
              No parent companies yet.
            </p>
          ) : null}

          {companies.map((company) => {
            const staffDraft = getStaffDraft(company.id);
            const inviteUrl = inviteUrls[company.id];

            return (
            <div
              key={company.id}
              className="grid gap-4 rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-950">{company.name}</p>
                  <p className="text-sm text-stone-500">
                    {company.slug} - {company.timezone} - {company.currency}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-stone-200 bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                    {company.isActive ? "Active" : "Disabled"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={Boolean(pendingAction)}
                        className="rounded-lg border-stone-300 bg-white text-stone-900 hover:bg-stone-100"
                        aria-label={`Open actions for ${company.name}`}
                      >
                        <MoreHorizontalIcon className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white text-stone-950">
                      <DropdownMenuLabel>Company actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild>
                        <Link href={`/platform/companies/${company.id}`}>Edit details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-stone-200" />
                      <DropdownMenuItem
                        variant={company.isActive ? "destructive" : "default"}
                        onSelect={() =>
                          void submitJson(
                            `/api/platform/companies/${company.id}`,
                            { ...company, isActive: !company.isActive },
                            `toggle:${company.id}`,
                          )
                        }
                      >
                        {company.isActive ? "Disable company" : "Enable company"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <form
                className="grid gap-3 border-t border-stone-200 pt-4 lg:grid-cols-5"
                onSubmit={(event) => {
                  event.preventDefault();
                  void submitJson(
                    `/api/platform/companies/${company.id}/staff`,
                    staffDraft,
                    `staff:${company.id}`,
                  );
                }}
              >
                <FormField label="Owner username">
                  <Input
                    value={staffDraft.username}
                    onChange={(event) =>
                      updateStaffDraft(company.id, { username: event.target.value })
                    }
                  />
                </FormField>
                <FormField label="Name">
                  <Input
                    value={staffDraft.name}
                    onChange={(event) =>
                      updateStaffDraft(company.id, { name: event.target.value })
                    }
                  />
                </FormField>
                <FormField label="Email">
                  <Input
                    type="email"
                    value={staffDraft.email}
                    onChange={(event) =>
                      updateStaffDraft(company.id, { email: event.target.value })
                    }
                  />
                </FormField>
                <FormField label="Role">
                  <Select
                    value={staffDraft.role}
                    onValueChange={(role) => updateStaffDraft(company.id, { role })}
                  >
                    <SelectTrigger className="h-8 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY_OWNER">Company Owner</SelectItem>
                      <SelectItem value="COMPANY_MANAGER">Company Manager</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
                <Button
                  type="submit"
                  disabled={Boolean(pendingAction)}
                  className="mt-auto rounded-lg bg-stone-950 text-white hover:bg-stone-800"
                >
                  {pendingAction === `staff:${company.id}` ? "Creating..." : "Create Invite"}
                </Button>
              </form>
              {inviteUrl ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">
                    Invite link
                  </p>
                  <p className="mt-1 break-all text-sm text-stone-700">{inviteUrl}</p>
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
              ) : null}
            </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
