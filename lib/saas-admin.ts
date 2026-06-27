import { and, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { locations, memberships, organizations, users } from "@/db/schema";
import { hashPassword } from "@/lib/passwords";
import { slugify } from "@/lib/slugs";
import {
  createChildRestaurantSchema,
  createCompanyStaffUserSchema,
  createCompanyOrganizationSchema,
  createRestaurantLocationSchema,
  createRestaurantStaffUserSchema,
  updateChildRestaurantAdminSchema,
  updateOrganizationAdminSchema,
} from "@/lib/validations/tenant-admin";
import {
  DEFAULT_COMPANY_ORGANIZATION_ID,
  DEFAULT_RESTAURANT_ORGANIZATION_ID,
  isDefaultCompanyOrganizationId,
} from "@/lib/tenant-defaults";

async function ensureUniqueOrganizationSlug(baseName: string) {
  const db = getDb();
  const baseSlug = slugify(baseName) || "tenant";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, candidate))
      .limit(1);

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

async function ensureUniqueLocationSlug(organizationId: string, baseName: string) {
  const db = getDb();
  const baseSlug = slugify(baseName) || "location";
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const [existing] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.organizationId, organizationId), eq(locations.slug, candidate)))
      .limit(1);

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function listPlatformCompanies() {
  return getDb()
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.type, "COMPANY"),
        ne(organizations.id, DEFAULT_COMPANY_ORGANIZATION_ID),
      ),
    );
}

export async function getPlatformCompany(companyOrganizationId: string) {
  const [company] = await getDb()
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.id, companyOrganizationId),
        eq(organizations.type, "COMPANY"),
        ne(organizations.id, DEFAULT_COMPANY_ORGANIZATION_ID),
      ),
    )
    .limit(1);

  return company ?? null;
}

export async function createCompanyOrganization(input: unknown) {
  const parsed = createCompanyOrganizationSchema.parse(input);
  const db = getDb();
  const slug = await ensureUniqueOrganizationSlug(parsed.name);
  const [company] = await db
    .insert(organizations)
    .values({
      type: "COMPANY",
      slug,
      name: parsed.name,
      timezone: parsed.timezone,
      currency: parsed.currency.toUpperCase(),
      isActive: true,
      updatedAt: new Date(),
    })
    .returning();

  return company;
}

export async function updateOrganizationAdmin(
  organizationId: string,
  input: unknown,
  expectedType?: "COMPANY" | "RESTAURANT",
  parentOrganizationId?: string,
) {
  const parsed = updateOrganizationAdminSchema.parse(input);
  const db = getDb();
  const conditions = [eq(organizations.id, organizationId)];

  if (expectedType) {
    conditions.push(eq(organizations.type, expectedType));
  }

  if (parentOrganizationId) {
    conditions.push(eq(organizations.parentOrganizationId, parentOrganizationId));
  }

  const [organization] = await db
    .update(organizations)
    .set({
      name: parsed.name,
      timezone: parsed.timezone,
      currency: parsed.currency.toUpperCase(),
      isActive: parsed.isActive,
      updatedAt: new Date(),
    })
    .where(and(...conditions))
    .returning();

  return organization ?? null;
}

export async function updateChildRestaurantAdmin(
  companyOrganizationId: string,
  restaurantOrganizationId: string,
  input: unknown,
) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    return null;
  }

  const parsed = updateChildRestaurantAdminSchema.parse(input);
  const db = getDb();

  return db.transaction(async (tx) => {
    const [organization] = await tx
      .update(organizations)
      .set({
        name: parsed.name,
        timezone: parsed.timezone,
        currency: parsed.currency.toUpperCase(),
        isActive: parsed.isActive,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(organizations.id, restaurantOrganizationId),
          eq(organizations.type, "RESTAURANT"),
          eq(organizations.parentOrganizationId, companyOrganizationId),
          ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
        ),
      )
      .returning();

    if (!organization) {
      return null;
    }

    if (parsed.location) {
      if (parsed.location.qrSlug) {
        const [existingQrLocation] = await tx
          .select({ id: locations.id })
          .from(locations)
          .where(
            and(
              eq(locations.qrSlug, parsed.location.qrSlug),
              ne(locations.organizationId, restaurantOrganizationId),
            ),
          )
          .limit(1);

        if (existingQrLocation) {
          throw new Error("QR slug is already used by another location.");
        }
      }

      await tx
        .update(locations)
        .set({
          name: parsed.location.name,
          label: parsed.location.label,
          qrSlug: parsed.location.qrSlug,
          timezone: parsed.location.timezone,
          isActive: parsed.location.isActive,
          updatedAt: new Date(),
        })
        .where(eq(locations.organizationId, restaurantOrganizationId));
    }

    return organization;
  });
}

export async function listCompanyRestaurants(companyOrganizationId: string) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    return [];
  }

  const rows = await getDb()
    .select({
      organization: organizations,
      location: locations,
    })
    .from(organizations)
    .leftJoin(locations, eq(locations.organizationId, organizations.id))
    .where(
      and(
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
        ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
      ),
    );

  const restaurantMap = new Map<
    string,
    typeof organizations.$inferSelect & {
      locations: (typeof locations.$inferSelect)[];
      locationsCount: number;
      primaryLocation: typeof locations.$inferSelect | null;
    }
  >();

  for (const row of rows) {
    const current = restaurantMap.get(row.organization.id);

    if (!current) {
      restaurantMap.set(row.organization.id, {
        ...row.organization,
        locations: row.location ? [row.location] : [],
        locationsCount: row.location ? 1 : 0,
        primaryLocation: row.location,
      });
      continue;
    }

    current.locationsCount += row.location ? 1 : 0;
    if (row.location) {
      current.locations.push(row.location);
    }
    current.primaryLocation ??= row.location;
  }

  return Array.from(restaurantMap.values());
}

export async function getCompanyRestaurant(
  companyOrganizationId: string,
  restaurantOrganizationId: string,
) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    return null;
  }

  const [row] = await getDb()
    .select({
      organization: organizations,
      location: locations,
    })
    .from(organizations)
    .leftJoin(locations, eq(locations.organizationId, organizations.id))
    .where(
      and(
        eq(organizations.id, restaurantOrganizationId),
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
        ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
      ),
    )
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    ...row.organization,
    primaryLocation: row.location,
    locations: await listRestaurantLocations(
      companyOrganizationId,
      restaurantOrganizationId,
    ),
  };
}

export async function listRestaurantLocations(
  companyOrganizationId: string,
  restaurantOrganizationId: string,
) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    return [];
  }

  const [restaurant] = await getDb()
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, restaurantOrganizationId),
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
        ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
      ),
    )
    .limit(1);

  if (!restaurant) {
    return null;
  }

  return getDb()
    .select()
    .from(locations)
    .where(eq(locations.organizationId, restaurantOrganizationId));
}

export async function createRestaurantLocation(
  companyOrganizationId: string,
  restaurantOrganizationId: string,
  input: unknown,
) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    throw new Error("Create a real parent company before creating locations.");
  }

  const parsed = createRestaurantLocationSchema.parse(input);
  const db = getDb();
  const [restaurant] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, restaurantOrganizationId),
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
      ),
    )
    .limit(1);

  if (!restaurant) {
    throw new Error("Restaurant not found.");
  }

  if (parsed.qrSlug) {
    const [existingQrLocation] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.qrSlug, parsed.qrSlug))
      .limit(1);

    if (existingQrLocation) {
      throw new Error("QR slug is already used by another location.");
    }
  }

  const slug = await ensureUniqueLocationSlug(restaurantOrganizationId, parsed.name);
  const [location] = await db
    .insert(locations)
    .values({
      organizationId: restaurantOrganizationId,
      slug,
      name: parsed.name,
      label: parsed.label,
      qrSlug: parsed.qrSlug,
      timezone: parsed.timezone,
      isActive: parsed.isActive,
      updatedAt: new Date(),
    })
    .returning();

  return location;
}

export async function updateRestaurantLocation(
  companyOrganizationId: string,
  restaurantOrganizationId: string,
  locationId: string,
  input: unknown,
) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    return null;
  }

  const parsed = createRestaurantLocationSchema.parse(input);
  const db = getDb();

  if (parsed.qrSlug) {
    const [existingQrLocation] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.qrSlug, parsed.qrSlug), ne(locations.id, locationId)))
      .limit(1);

    if (existingQrLocation) {
      throw new Error("QR slug is already used by another location.");
    }
  }

  const [location] = await db
    .update(locations)
    .set({
      name: parsed.name,
      label: parsed.label,
      qrSlug: parsed.qrSlug,
      timezone: parsed.timezone,
      isActive: parsed.isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(locations.id, locationId),
        eq(locations.organizationId, restaurantOrganizationId),
      ),
    )
    .returning();

  if (!location) {
    return null;
  }

  const [restaurant] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, restaurantOrganizationId),
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
      ),
    )
    .limit(1);

  return restaurant ? location : null;
}

export async function createChildRestaurant(
  companyOrganizationId: string,
  input: unknown,
) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    throw new Error("Create a real parent company before creating restaurants.");
  }

  const parsed = createChildRestaurantSchema.parse(input);
  const db = getDb();
  const organizationSlug = await ensureUniqueOrganizationSlug(parsed.name);

  return db.transaction(async (tx) => {
    const [restaurant] = await tx
      .insert(organizations)
      .values({
        parentOrganizationId: companyOrganizationId,
        type: "RESTAURANT",
        slug: organizationSlug,
        name: parsed.name,
        timezone: parsed.timezone,
        currency: parsed.currency.toUpperCase(),
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();
    const locationSlug = await ensureUniqueLocationSlug(restaurant.id, parsed.locationName);
    const [location] = await tx
      .insert(locations)
      .values({
        organizationId: restaurant.id,
        slug: locationSlug,
        name: parsed.locationName,
        label: parsed.locationLabel,
        timezone: parsed.timezone,
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();

    return { ...restaurant, primaryLocation: location };
  });
}

export async function createCompanyStaffUser(companyOrganizationId: string, input: unknown) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    throw new Error("Default system company cannot receive staff users.");
  }

  const parsed = createCompanyStaffUserSchema.parse(input);
  const db = getDb();
  const [company] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, companyOrganizationId),
        eq(organizations.type, "COMPANY"),
      ),
    )
    .limit(1);

  if (!company) {
    throw new Error("Company not found.");
  }

  const passwordHash = await hashPassword(parsed.password);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        username: parsed.username,
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash,
        role: "ADMIN",
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .returning();
    const [membership] = await tx
      .insert(memberships)
      .values({
        userId: user.id,
        organizationId: companyOrganizationId,
        locationId: null,
        role: parsed.role,
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();

    return { user, membership };
  });
}

export async function createRestaurantStaffUser(
  companyOrganizationId: string,
  restaurantOrganizationId: string,
  input: unknown,
) {
  if (
    isDefaultCompanyOrganizationId(companyOrganizationId) ||
    restaurantOrganizationId === DEFAULT_RESTAURANT_ORGANIZATION_ID
  ) {
    throw new Error("Default system restaurant cannot receive staff users.");
  }

  const parsed = createRestaurantStaffUserSchema.parse(input);
  const db = getDb();
  const [restaurant] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.id, restaurantOrganizationId),
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
      ),
    )
    .limit(1);

  if (!restaurant) {
    throw new Error("Restaurant not found.");
  }

  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(eq(locations.organizationId, restaurantOrganizationId))
    .limit(1);

  if (!location) {
    throw new Error("Restaurant needs a location before staff can be assigned.");
  }

  const passwordHash = await hashPassword(parsed.password);

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({
        username: parsed.username,
        name: parsed.name,
        email: parsed.email.toLowerCase(),
        passwordHash,
        role: parsed.role === "ORDER_OPERATOR" ? "STAFF" : "ADMIN",
        status: "ACTIVE",
        updatedAt: new Date(),
      })
      .returning();
    const [membership] = await tx
      .insert(memberships)
      .values({
        userId: user.id,
        organizationId: restaurantOrganizationId,
        locationId: location.id,
        role: parsed.role,
        isActive: true,
        updatedAt: new Date(),
      })
      .returning();

    return { user, membership };
  });
}
