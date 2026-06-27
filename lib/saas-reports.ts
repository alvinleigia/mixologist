import { and, count, desc, eq, inArray, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { locations, memberships, orders, organizations } from "@/db/schema";
import {
  DEFAULT_COMPANY_ORGANIZATION_ID,
  DEFAULT_LOCATION_ID,
  DEFAULT_RESTAURANT_ORGANIZATION_ID,
  isDefaultCompanyOrganizationId,
} from "@/lib/tenant-defaults";

const activeOrderStatuses = ["PENDING", "PREPARING", "READY"] as const;

function firstCount(rows: Array<{ value: number }>) {
  return Number(rows[0]?.value ?? 0);
}

function firstDate(rows: Array<{ createdAt: Date }>) {
  return rows[0]?.createdAt?.toISOString() ?? null;
}

export async function getPlatformSummary() {
  const db = getDb();
  const [companies, restaurants, activeLocations, staff, activeOrders, completedOrders] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(organizations)
        .where(
          and(
            eq(organizations.type, "COMPANY"),
            ne(organizations.id, DEFAULT_COMPANY_ORGANIZATION_ID),
          ),
        ),
      db
        .select({ value: count() })
        .from(organizations)
        .where(
          and(
            eq(organizations.type, "RESTAURANT"),
            ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
          ),
        ),
      db
        .select({ value: count() })
        .from(locations)
        .where(and(eq(locations.isActive, true), ne(locations.id, DEFAULT_LOCATION_ID))),
      db
        .select({ value: count() })
        .from(memberships)
        .where(
          and(
            eq(memberships.isActive, true),
            ne(memberships.organizationId, DEFAULT_COMPANY_ORGANIZATION_ID),
            ne(memberships.organizationId, DEFAULT_RESTAURANT_ORGANIZATION_ID),
          ),
        ),
      db
        .select({ value: count() })
        .from(orders)
        .where(
          and(
            inArray(orders.status, activeOrderStatuses),
            ne(orders.organizationId, DEFAULT_RESTAURANT_ORGANIZATION_ID),
          ),
        ),
      db
        .select({ value: count() })
        .from(orders)
        .where(
          and(
            ne(orders.status, "CANCELLED"),
            ne(orders.organizationId, DEFAULT_RESTAURANT_ORGANIZATION_ID),
          ),
        ),
    ]);

  return {
    companyTenants: firstCount(companies),
    restaurantTenants: firstCount(restaurants),
    activeLocations: firstCount(activeLocations),
    activeStaffMemberships: firstCount(staff),
    activeOrders: firstCount(activeOrders),
    completedOrders: firstCount(completedOrders),
  };
}

export async function getPlatformCompanyBreakdown() {
  const db = getDb();
  const companies = await listReportCompanies();

  return Promise.all(
    companies.map(async (company) => {
      const childRestaurants = await db
        .select({ id: organizations.id })
        .from(organizations)
        .where(
          and(
            eq(organizations.parentOrganizationId, company.id),
            eq(organizations.type, "RESTAURANT"),
            ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
          ),
        );
      const childRestaurantIds = childRestaurants.map((restaurant) => restaurant.id);

      if (childRestaurantIds.length === 0) {
        return {
          id: company.id,
          name: company.name,
          slug: company.slug,
          isActive: company.isActive,
          childRestaurants: 0,
          activeLocations: 0,
          activeStaffMemberships: 0,
          activeOrders: 0,
          completedOrders: 0,
          cancelledOrders: 0,
          lastOrderAt: null,
        };
      }

      const [
        activeLocations,
        staff,
        activeOrders,
        completedOrders,
        cancelledOrders,
        lastOrder,
      ] = await Promise.all([
        db
          .select({ value: count() })
          .from(locations)
          .where(
            and(
              inArray(locations.organizationId, childRestaurantIds),
              eq(locations.isActive, true),
            ),
          ),
        db
          .select({ value: count() })
          .from(memberships)
          .where(
            and(
              inArray(memberships.organizationId, childRestaurantIds),
              eq(memberships.isActive, true),
            ),
          ),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              inArray(orders.organizationId, childRestaurantIds),
              inArray(orders.status, activeOrderStatuses),
            ),
          ),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              inArray(orders.organizationId, childRestaurantIds),
              ne(orders.status, "CANCELLED"),
            ),
          ),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              inArray(orders.organizationId, childRestaurantIds),
              eq(orders.status, "CANCELLED"),
            ),
          ),
        db
          .select({ createdAt: orders.createdAt })
          .from(orders)
          .where(inArray(orders.organizationId, childRestaurantIds))
          .orderBy(desc(orders.createdAt))
          .limit(1),
      ]);

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        isActive: company.isActive,
        childRestaurants: childRestaurantIds.length,
        activeLocations: firstCount(activeLocations),
        activeStaffMemberships: firstCount(staff),
        activeOrders: firstCount(activeOrders),
        completedOrders: firstCount(completedOrders),
        cancelledOrders: firstCount(cancelledOrders),
        lastOrderAt: firstDate(lastOrder),
      };
    }),
  );
}

export async function getCompanySummary(companyOrganizationId: string) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    return {
      childRestaurants: 0,
      activeLocations: 0,
      activeStaffMemberships: 0,
      activeOrders: 0,
      completedOrders: 0,
    };
  }

  const db = getDb();
  const childRestaurants = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(
      and(
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
        ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
      ),
    );
  const childRestaurantIds = childRestaurants.map((restaurant) => restaurant.id);

  if (childRestaurantIds.length === 0) {
    return {
      childRestaurants: 0,
      activeLocations: 0,
      activeStaffMemberships: 0,
      activeOrders: 0,
      completedOrders: 0,
    };
  }

  const [activeLocations, staff, activeOrders, completedOrders] = await Promise.all([
    db
      .select({ value: count() })
      .from(locations)
      .where(
        and(
          inArray(locations.organizationId, childRestaurantIds),
          eq(locations.isActive, true),
        ),
      ),
    db
      .select({ value: count() })
      .from(memberships)
      .where(
        and(
          inArray(memberships.organizationId, childRestaurantIds),
          eq(memberships.isActive, true),
        ),
      ),
    db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          inArray(orders.organizationId, childRestaurantIds),
          inArray(orders.status, activeOrderStatuses),
        ),
      ),
    db
      .select({ value: count() })
      .from(orders)
      .where(
        and(
          inArray(orders.organizationId, childRestaurantIds),
          ne(orders.status, "CANCELLED"),
        ),
      ),
  ]);

  return {
    childRestaurants: childRestaurantIds.length,
    activeLocations: firstCount(activeLocations),
    activeStaffMemberships: firstCount(staff),
    activeOrders: firstCount(activeOrders),
    completedOrders: firstCount(completedOrders),
  };
}

export async function getCompanyRestaurantBreakdown(companyOrganizationId: string) {
  if (isDefaultCompanyOrganizationId(companyOrganizationId)) {
    return [];
  }

  const db = getDb();
  const restaurants = await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.parentOrganizationId, companyOrganizationId),
        eq(organizations.type, "RESTAURANT"),
        ne(organizations.id, DEFAULT_RESTAURANT_ORGANIZATION_ID),
      ),
    );

  return Promise.all(
    restaurants.map(async (restaurant) => {
      const [
        activeLocations,
        staff,
        activeOrders,
        completedOrders,
        cancelledOrders,
        lastOrder,
      ] = await Promise.all([
        db
          .select({ value: count() })
          .from(locations)
          .where(
            and(
              eq(locations.organizationId, restaurant.id),
              eq(locations.isActive, true),
            ),
          ),
        db
          .select({ value: count() })
          .from(memberships)
          .where(
            and(
              eq(memberships.organizationId, restaurant.id),
              eq(memberships.isActive, true),
            ),
          ),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              eq(orders.organizationId, restaurant.id),
              inArray(orders.status, activeOrderStatuses),
            ),
          ),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              eq(orders.organizationId, restaurant.id),
              ne(orders.status, "CANCELLED"),
            ),
          ),
        db
          .select({ value: count() })
          .from(orders)
          .where(
            and(
              eq(orders.organizationId, restaurant.id),
              eq(orders.status, "CANCELLED"),
            ),
          ),
        db
          .select({ createdAt: orders.createdAt })
          .from(orders)
          .where(eq(orders.organizationId, restaurant.id))
          .orderBy(desc(orders.createdAt))
          .limit(1),
      ]);

      return {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        isActive: restaurant.isActive,
        activeLocations: firstCount(activeLocations),
        activeStaffMemberships: firstCount(staff),
        activeOrders: firstCount(activeOrders),
        completedOrders: firstCount(completedOrders),
        cancelledOrders: firstCount(cancelledOrders),
        lastOrderAt: firstDate(lastOrder),
      };
    }),
  );
}

async function listReportCompanies() {
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
