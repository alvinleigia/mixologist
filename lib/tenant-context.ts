import { auth } from "@/auth";
import {
  DEFAULT_LOCATION_ID,
  DEFAULT_RESTAURANT_ORGANIZATION_ID,
} from "@/lib/tenant-defaults";

export type TenantContext = {
  organizationId: string;
  locationId: string;
};

export function getDefaultTenantContext(): TenantContext {
  return {
    organizationId: DEFAULT_RESTAURANT_ORGANIZATION_ID,
    locationId: DEFAULT_LOCATION_ID,
  };
}

export async function getCurrentTenantContext() {
  const session = await auth();

  if (session?.user.organizationId && session.user.locationId) {
    return {
      organizationId: session.user.organizationId,
      locationId: session.user.locationId,
    };
  }

  if (session?.user) {
    throw new Error("Signed-in user is missing tenant or location access.");
  }

  return getDefaultTenantContext();
}
