import {
  boolean,
  AnyPgColumn,
  index,
  integer,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["ADMIN", "STAFF"]);

export const organizationTypeEnum = pgEnum("organization_type", [
  "COMPANY",
  "RESTAURANT",
]);

export const membershipRoleEnum = pgEnum("membership_role", [
  "PLATFORM_ADMIN",
  "COMPANY_OWNER",
  "COMPANY_MANAGER",
  "RESTAURANT_MANAGER",
  "ORDER_OPERATOR",
]);

export const userStatusEnum = pgEnum("user_status", [
  "INVITED",
  "ACTIVE",
  "DISABLED",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
]);

export const orderItemStatusEnum = pgEnum("order_item_status", [
  "PENDING",
  "PREPARING",
  "READY",
  "DELIVERED",
  "CANCELLED",
]);

export const cancelledByTypeEnum = pgEnum("cancelled_by_type", [
  "CUSTOMER",
  "STAFF",
  "ADMIN",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull(),
  status: userStatusEnum("status").default("ACTIVE").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    parentOrganizationId: uuid("parent_organization_id").references(
      (): AnyPgColumn => organizations.id,
      { onDelete: "cascade" },
    ),
    type: organizationTypeEnum("type").notNull(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    logoUrl: text("logo_url"),
    timezone: text("timezone").default("Asia/Calcutta").notNull(),
    currency: text("currency").default("INR").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("organizations_parent_idx").on(table.parentOrganizationId),
    uniqueIndex("organizations_slug_unique").on(table.slug),
  ],
);

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    slug: text("slug").notNull(),
    qrSlug: text("qr_slug"),
    name: text("name").notNull(),
    label: text("label"),
    timezone: text("timezone").default("Asia/Calcutta").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("locations_organization_idx").on(table.organizationId),
    uniqueIndex("locations_org_slug_unique").on(table.organizationId, table.slug),
    uniqueIndex("locations_qr_slug_unique").on(table.qrSlug),
  ],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "cascade",
    }),
    role: membershipRoleEnum("role").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("memberships_organization_idx").on(table.organizationId),
    index("memberships_location_idx").on(table.locationId),
    uniqueIndex("memberships_user_org_location_unique").on(
      table.userId,
      table.organizationId,
      table.locationId,
    ),
  ],
);

export const staffInvitations = pgTable(
  "staff_invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    membershipId: uuid("membership_id")
      .references(() => memberships.id, { onDelete: "cascade" })
      .notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    acceptedAt: timestamp("accepted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("staff_invitations_token_hash_unique").on(table.tokenHash),
    index("staff_invitations_user_idx").on(table.userId),
    index("staff_invitations_membership_idx").on(table.membershipId),
  ],
);

export const appState = pgTable("app_state", {
  key: text("key").primaryKey(),
  ordersResetAt: timestamp("orders_reset_at"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  locationId: uuid("location_id").references(() => locations.id, {
    onDelete: "cascade",
  }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  locationId: uuid("location_id").references(() => locations.id, {
    onDelete: "cascade",
  }),
  categoryId: uuid("category_id")
    .references(() => menuCategories.id, { onDelete: "cascade" })
    .notNull(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  locationId: uuid("location_id")
    .references(() => locations.id, { onDelete: "cascade" })
    .notNull(),
  orderNo: integer("order_no").notNull().unique(),
  customerName: text("customer_name").notNull(),
  customerToken: text("customer_token").notNull(),
  categoryId: text("category_id").notNull(),
  categoryName: text("category_name").notNull(),
  drinkId: text("drink_id").notNull(),
  drinkName: text("drink_name").notNull(),
  status: orderStatusEnum("status").default("PENDING").notNull(),
  preparedById: uuid("prepared_by_id").references(() => users.id),
  startedAt: timestamp("started_at"),
  readyAt: timestamp("ready_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancelledByType: cancelledByTypeEnum("cancelled_by_type"),
  cancelledByUserId: uuid("cancelled_by_user_id").references(() => users.id),
  cancelReason: text("cancel_reason"),
  announcementCount: integer("announcement_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id, { onDelete: "cascade" })
    .notNull(),
  locationId: uuid("location_id")
    .references(() => locations.id, { onDelete: "cascade" })
    .notNull(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onDelete: "cascade" })
    .notNull(),
  categoryId: text("category_id").notNull(),
  categoryName: text("category_name").notNull(),
  drinkId: text("drink_id").notNull(),
  drinkName: text("drink_name").notNull(),
  quantity: integer("quantity").default(1).notNull(),
  notes: text("notes"),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }),
  status: orderItemStatusEnum("status").default("PENDING").notNull(),
  startedAt: timestamp("started_at"),
  readyAt: timestamp("ready_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
