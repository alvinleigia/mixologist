import { z } from "zod";

export const staffRoles = [
  "COMPANY_OWNER",
  "COMPANY_MANAGER",
  "RESTAURANT_MANAGER",
  "ORDER_OPERATOR",
] as const;

export const companyStaffRoles = ["COMPANY_OWNER", "COMPANY_MANAGER"] as const;

export const restaurantStaffRoles = ["RESTAURANT_MANAGER", "ORDER_OPERATOR"] as const;

export const organizationSettingsSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required").max(120),
  logoUrl: z
    .string()
    .trim()
    .url("Logo must be a valid URL")
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  timezone: z.string().trim().min(2).max(80),
  currency: z.string().trim().min(3).max(8),
});

export const locationSettingsSchema = z.object({
  name: z.string().trim().min(2, "Location name is required").max(120),
  label: z.string().trim().max(160).optional().transform((value) => value || null),
  qrSlug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens")
    .min(3)
    .max(80)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || null),
  timezone: z.string().trim().min(2).max(80),
  isActive: z.boolean().default(true),
});

export const createStaffUserSchema = z.object({
  username: z.string().trim().min(3).max(60),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(staffRoles),
});

export const createStaffInvitationSchema = z.object({
  username: z.string().trim().min(3).max(60),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  role: z.enum(staffRoles),
});

export const createCompanyStaffInvitationSchema = createStaffInvitationSchema.extend({
  role: z.enum(companyStaffRoles),
});

export const createRestaurantStaffInvitationSchema = createStaffInvitationSchema.extend({
  role: z.enum(restaurantStaffRoles),
});

export const updateStaffMembershipSchema = z.object({
  role: z.enum(staffRoles),
  isActive: z.boolean(),
});

export const acceptStaffInvitationSchema = z.object({
  token: z.string().trim().min(20),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createCompanyOrganizationSchema = z.object({
  name: z.string().trim().min(2, "Company name is required").max(120),
  timezone: z.string().trim().min(2).max(80).default("Asia/Calcutta"),
  currency: z.string().trim().min(3).max(8).default("INR"),
});

export const updateOrganizationAdminSchema = z.object({
  name: z.string().trim().min(2, "Organization name is required").max(120),
  timezone: z.string().trim().min(2).max(80),
  currency: z.string().trim().min(3).max(8),
  isActive: z.boolean(),
});

export const updateChildRestaurantAdminSchema = updateOrganizationAdminSchema.extend({
  location: locationSettingsSchema.optional(),
});

export const createRestaurantLocationSchema = locationSettingsSchema;

export const createChildRestaurantSchema = z.object({
  name: z.string().trim().min(2, "Restaurant name is required").max(120),
  timezone: z.string().trim().min(2).max(80).default("Asia/Calcutta"),
  currency: z.string().trim().min(3).max(8).default("INR"),
  locationName: z.string().trim().min(2, "Location name is required").max(120),
  locationLabel: z.string().trim().max(160).optional().transform((value) => value || null),
});

const createTenantStaffBaseSchema = z.object({
  username: z.string().trim().min(3).max(60),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const createCompanyStaffUserSchema = createTenantStaffBaseSchema.extend({
  role: z.enum(companyStaffRoles),
});

export const createRestaurantStaffUserSchema = createTenantStaffBaseSchema.extend({
  role: z.enum(restaurantStaffRoles),
});
