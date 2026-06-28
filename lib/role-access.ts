import type { MembershipRole } from "@/lib/staff-auth";

export const platformAdminRoles = ["PLATFORM_ADMIN"] satisfies MembershipRole[];

export const companyAdminRoles = [
  "PLATFORM_ADMIN",
  "COMPANY_OWNER",
  "COMPANY_MANAGER",
] satisfies MembershipRole[];

export const restaurantAdminRoles = [
  "PLATFORM_ADMIN",
  "COMPANY_OWNER",
  "COMPANY_MANAGER",
  "RESTAURANT_MANAGER",
] satisfies MembershipRole[];

export const operationalRoles = [
  ...restaurantAdminRoles,
  "ORDER_OPERATOR",
] satisfies MembershipRole[];

export function canAccessRole(
  role: MembershipRole | null | undefined,
  allowedRoles: MembershipRole[],
) {
  return Boolean(role && allowedRoles.includes(role));
}

export function getHomePathForRole(role: MembershipRole) {
  if (canAccessRole(role, platformAdminRoles)) {
    return "/platform";
  }

  if (role === "COMPANY_OWNER" || role === "COMPANY_MANAGER") {
    return "/company";
  }

  if (role === "RESTAURANT_MANAGER") {
    return "/restaurant";
  }

  if (role === "ORDER_OPERATOR") {
    return "/operations/orders";
  }

  return "/operations/orders";
}

export function canAccessNavigationPath(role: MembershipRole, href: string) {
  if (href === "/platform") {
    return canAccessRole(role, platformAdminRoles);
  }

  if (href === "/company") {
    return role === "COMPANY_OWNER" || role === "COMPANY_MANAGER";
  }

  if (href === "/restaurant") {
    return role === "RESTAURANT_MANAGER";
  }

  if (href === "/operations/orders") {
    return role === "RESTAURANT_MANAGER" || role === "ORDER_OPERATOR";
  }

  if (href === "/operations/menu") {
    return role === "RESTAURANT_MANAGER";
  }

  if (href === "/operations/inventory") {
    return role === "RESTAURANT_MANAGER";
  }

  return true;
}

export function formatRole(role: MembershipRole) {
  return role.replaceAll("_", " ");
}
