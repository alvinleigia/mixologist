import { auth } from "@/auth";
import { canAccessRole, operationalRoles } from "@/lib/role-access";
import type { MembershipRole } from "@/lib/staff-auth";

export async function requireStaffSession() {
  const session = await auth();

  if (!session?.user || !canAccessRole(session.user.role, operationalRoles)) {
    return null;
  }

  return session;
}

export async function requireRole(allowedRoles: MembershipRole[]) {
  const session = await auth();

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return session;
}

export async function requireLocationAccess() {
  const session = await requireStaffSession();

  if (!session?.user.organizationId || !session.user.locationId) {
    return null;
  }

  return session;
}
