import { headers } from "next/headers";

import { getMembershipAccessOptions } from "@/lib/location-access";
import { getTenantDomainAccessScopeFromDomain } from "@/lib/tenant-domains";
import type { MembershipRole } from "@/lib/staff-auth";

type SessionAccessUser = {
  id: string;
  organizationId: string;
  locationId: string;
  role: MembershipRole;
};

export async function isSessionAccessAllowedForCurrentDomain(
  user: SessionAccessUser,
) {
  const requestHeaders = await headers();
  const accessScope = await getTenantDomainAccessScopeFromDomain(
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"),
  );
  const allowedMemberships = await getMembershipAccessOptions(user.id, accessScope);

  return allowedMemberships.some(
    (membership) =>
      membership.organizationId === user.organizationId &&
      (membership.locationId ?? "") === user.locationId &&
      membership.role === user.role,
  );
}
