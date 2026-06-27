export const DEFAULT_COMPANY_ORGANIZATION_ID =
  "00000000-0000-0000-0000-000000000001";
export const DEFAULT_RESTAURANT_ORGANIZATION_ID =
  "00000000-0000-0000-0000-000000000002";
export const DEFAULT_LOCATION_ID = "00000000-0000-0000-0000-000000000003";

export const DEFAULT_ORGANIZATION_IDS = [
  DEFAULT_COMPANY_ORGANIZATION_ID,
  DEFAULT_RESTAURANT_ORGANIZATION_ID,
] as const;

export function isDefaultCompanyOrganizationId(organizationId: string | null | undefined) {
  return organizationId === DEFAULT_COMPANY_ORGANIZATION_ID;
}

export function isDefaultRestaurantOrganizationId(
  organizationId: string | null | undefined,
) {
  return organizationId === DEFAULT_RESTAURANT_ORGANIZATION_ID;
}

export function isDefaultLocationId(locationId: string | null | undefined) {
  return locationId === DEFAULT_LOCATION_ID;
}
