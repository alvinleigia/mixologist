import { AppHeader } from "@/components/shared/AppHeader";
import { CommercialAccessBlocked } from "@/components/admin/CommercialAccessBlocked";
import { LocationSwitcher } from "@/components/admin/LocationSwitcher";
import { AppShell } from "@/components/shared/AppShell";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { getTenantSubscriptionAccess } from "@/lib/billing";
import { canAccessRole, platformAdminRoles } from "@/lib/role-access";
import type { MembershipRole } from "@/lib/staff-auth";

type AdminRoute = {
  href: string;
  label: string;
  description: string;
};

type SaasAdminShellProps = {
  activePath: string;
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  user: {
    name?: string | null;
    organizationId?: string | null;
    role: MembershipRole;
  };
};

const adminRoutes: AdminRoute[] = [
  {
    href: "/platform",
    label: "Platform",
    description: "Create and manage companies.",
  },
  {
    href: "/company",
    label: "Company",
    description: "Manage restaurants and summaries.",
  },
  {
    href: "/restaurant",
    label: "Restaurant",
    description: "Manage settings, locations and staff.",
  },
  {
    href: "/operations/orders",
    label: "Orders",
    description: "Live order operations.",
  },
  {
    href: "/operations/menu",
    label: "Menu Manager",
    description: "Categories and products.",
  },
  {
    href: "/operations/inventory",
    label: "Inventory",
    description: "Stock control.",
  },
];

export async function SaasAdminShell({
  activePath,
  children,
  description,
  eyebrow,
  title,
  user,
}: SaasAdminShellProps) {
  const commercialAccess =
    user.organizationId && !canAccessRole(user.role, platformAdminRoles)
      ? await getTenantSubscriptionAccess(user.organizationId)
      : { allowed: true, status: null };

  return (
    <AppShell variant="dark" contentClassName="max-w-7xl">
      <AppHeader
        activePath={activePath}
        navigationItems={adminRoutes}
        user={{ name: user.name, role: user.role }}
      />
      <div className="mb-6 flex justify-end">
        <LocationSwitcher />
      </div>

      <section className="rounded-xl border border-white/10 bg-white/90 p-6 text-stone-950 shadow-[0_24px_80px_rgba(0,0,0,0.22)]">
        <SectionHeader
          eyebrow={eyebrow}
          title={title}
          description={description}
          className="mb-6"
        />
        {commercialAccess.allowed ? (
          children
        ) : (
          <CommercialAccessBlocked status={commercialAccess.status} />
        )}
      </section>
    </AppShell>
  );
}
