# Foodie SaaS Roadmap

This file is the persistent implementation tracker for turning the current single-location Foodie POS MVP into a multi-tenant SaaS platform.

Use this file as the starting point in future chat sessions. Before implementing a phase, review the current schema in `db/schema.ts`, order helpers in `lib/orders.ts`, and the active UI in `components/`.

## Current Product Snapshot

- The app is currently a working MVP for one bar/location.
- Customers can place multi-item orders without login.
- Staff log in with database-backed accounts created through admin/invite flows.
- Staff can manage menu categories and products.
- Orders support item-level preparation, ready, delivered, cancelled and announcement actions.
- Customer order history is stored locally on the customer device and synced with server order status.
- Database is Supabase/Postgres via Drizzle.
- UI uses shadcn-style reusable components under `components/ui`.

## Target SaaS Model

```text
Platform / SaaS Owner
  -> Parent Company / Company Tenant
       -> Restaurant / Brand / Child Tenant
            -> Locations / Bars
            -> Staff Users
            -> Menus
            -> Orders
       -> Company Dashboard / Reports
```

The future app must support:

- Platform admins managing all tenants.
- Parent companies managing child restaurants/brands.
- Restaurant managers managing locations, staff, menus and operations.
- Order operators seeing only assigned location orders.
- Parent companies viewing summary reports across child restaurants.
- Restaurant/location dashboards for local reporting.

## Phase 1: Core SaaS Data Model

Status: Foundation implemented; move to Phase 2 next. Inventory scope is intentionally deferred until the inventory module exists.

Goal: Add the tenant hierarchy before more UI expansion so tenancy is not retrofitted later.

Tasks:

- [x] Add `organizations` table.
- [x] Support organization hierarchy with `parentOrganizationId`.
- [x] Decide organization types: `COMPANY` and `RESTAURANT` for Phase 1. Platform admin remains a role, not an organization type yet.
- [x] Add `locations` table for restaurants, bars, event counters or branches.
- [x] Add `memberships` table linking users to organizations and roles.
- [x] Add `organizationId` and `locationId` to operational records for menu categories, menu items, orders and order items.
- [x] Scope menu categories/items by organization and location through `lib/menu.ts` and menu API routes.
- [x] Scope orders and order items by organization and location through `lib/orders.ts` and order API routes.
- [ ] Scope inventory by organization and location. Deferred because the inventory module/table has not been created yet.
- [x] Add tenant-aware indexes for common queries.
- [x] Create migration file `drizzle/0003_saas_core_tenant_foundation.sql`.
- [x] Backfill existing MVP records into a hidden default company, restaurant and location in the migration.
- [x] Add verification script `npm run db:verify:tenant` to check default tenant/location and missing tenant scope.

Key decision:

- The current app should become “one location inside one tenant”, not the whole system.

Implementation notes:

- Default company ID: `00000000-0000-0000-0000-000000000001`.
- Default restaurant organization ID: `00000000-0000-0000-0000-000000000002`.
- Default location ID: `00000000-0000-0000-0000-000000000003`.
- Schema additions are in `db/schema.ts`.
- Backfill migration is in `drizzle/0003_saas_core_tenant_foundation.sql`.
- Temporary Phase 1 tenant resolver is in `lib/tenant-context.ts`; it returns the default restaurant/location until Phase 2 auth memberships are implemented.
- Supabase migration `0003_saas_core_tenant_foundation.sql` has been applied.
- Tenant foundation verification passed with `npm run db:verify:tenant`.
- Do not create placeholder inventory tables during Phase 1. Inventory should be designed later as a real module, then scoped by `organizationId` and `locationId`.
- Next recommended implementation step is Phase 2: replace environment-based staff login with database-backed users, roles, memberships and tenant/location access checks.

## Phase 2: Auth, Roles And Access Control

Status: Core auth/access and membership-based location switching are implemented. User invitation flow is deferred to Phase 3 tenant admin UI.

Goal: Replace environment-based staff access with real user accounts, roles and tenant permissions.

Tasks:

- [x] Replace environment staff login with database-backed users. Only the first SaaS owner is bootstrapped from `.env.local`.
- [x] Keep Auth.js as the auth layer unless there is a strong reason to change.
- [x] Add password hashing and credential validation with Node `scrypt`.
- [x] Add roles such as `PLATFORM_ADMIN`, `COMPANY_OWNER`, `COMPANY_MANAGER`, `RESTAURANT_MANAGER`, `ORDER_OPERATOR`.
- [x] Resolve active organization/location from the signed-in session and membership.
- [x] Add a location switcher for users who can access multiple locations.
- [x] Ensure server routes never trust tenant/location IDs from the browser without membership checks.
- [ ] Add invitation flow for adding staff/users. Deferred to Phase 3 tenant admin UI.
- [x] Add user states: invited, active, disabled.
- [x] Add server utilities such as `requireLocationAccess` and `requireRole`.

Security rule:

- Every protected query must be scoped by a trusted `organizationId` and, where relevant, `locationId`.

Implementation notes:

- Staff authentication now validates against the `users` table and active `memberships`.
- Password hashes use the format `scrypt:<salt>:<hash>`.
- Auth.js JWT/session now carries `role`, `organizationId`, `locationId`, and `username`.
- Auth.js session updates validate active location memberships before switching `organizationId` and `locationId`.
- `getCurrentTenantContext()` resolves tenant/location from the signed-in user session; public unauthenticated routes still use the default MVP tenant context.
- Migration is in `drizzle/0004_database_staff_auth.sql`.

## Phase 3: Tenant Admin UI

Status: SaaS admin route shells, restaurant-level foundation, platform/company tenant CRUD, invitation-based staff onboarding, membership-based location switching, summary cards, first drill-down reporting, logo/QR settings, and staff invitation onboarding are implemented. Email delivery, audit logs and tests are still pending.

Goal: Build the management surfaces for platform admins, parent companies and restaurants.

Tasks:

- [x] Add dedicated SaaS admin route shells for `/platform`, `/company` and `/restaurant`.
- [x] Platform dashboard to create/manage parent companies.
- [x] Parent company dashboard to create/manage child restaurants.
- [x] Restaurant dashboard foundation inside `/restaurant`.
- [x] User management UI to create staff, assign roles and deactivate memberships.
- [x] Cross-tenant staff onboarding for platform-created company users and company-created restaurant users now uses invitation links.
- [x] Restaurant staff invitation links where invited users set their own password.
- [ ] Email delivery for invitation links. Current Phase 3 UI generates copyable links because SMTP is not configured yet.
- [x] Platform/company invitation links.
- [x] Organization settings: name, timezone, currency.
- [x] Organization settings: logo URL.
- [x] Location settings: name, label, active status, timezone.
- [x] Location settings: QR code slug.
- [x] First parent company overview of child restaurant health and activity.
- [x] First platform drill-down report by company tenant.
- [x] First company drill-down report by child restaurant.
- [x] First platform summary cards for tenant, location, staff and order activity.
- [x] Add empty/loading/error states for the restaurant-level tenant admin surface.

Suggested routes:

- `/platform`
- `/company`
- `/restaurant`
- `/restaurant/settings`
- `/restaurant/users`
- `/restaurant/locations`

Implementation notes:

- Restaurant-level admin now lives in `/restaurant`; `/staff` is focused on live orders and menu operations.
- Staff/operations naming is now standardized: `/staff` and `/staff/login` are canonical, and `ORDER_OPERATOR` is the operational role.
- Dedicated admin route shells now exist at `/platform`, `/company` and `/restaurant`.
- `/restaurant` uses the restaurant-level admin panel for settings, location and staff access.
- `/platform` can list, create, enable and disable company tenants.
- `/company` can list, create, enable and disable child restaurant tenants with a default location.
- `/platform` can create invite links for `COMPANY_OWNER` and `COMPANY_MANAGER` users for a company tenant.
- `/company` can create invite links for `RESTAURANT_MANAGER` and `ORDER_OPERATOR` users for a child restaurant tenant.
- Users with multiple active location memberships can switch location context from the admin/operations header.
- Shared admin shell/navigation lives in `components/admin/SaasAdminShell.tsx`.
- Shared access role lists live in `lib/role-access.ts`.
- SaaS tenant CRUD services live in `lib/saas-admin.ts`.
- Location membership lookup lives in `lib/location-access.ts`.
- Session location switching is handled by `app/api/session/locations/route.ts` and Auth.js `unstable_update`.
- Platform/company dashboard summaries are served by `app/api/platform/summary` and `app/api/company/summary`.
- Reporting summary helpers live in `lib/saas-reports.ts`.
- Platform reports now include company-level breakdowns for restaurants, locations, staff, active orders, non-cancelled orders, cancelled orders and last order time.
- Company reports now include child restaurant breakdowns for locations, staff, active orders, non-cancelled orders, cancelled orders and last order time.
- Platform/company admin users can sign in without a location-level membership; operational routes still require a location context.
- New server helpers are in `lib/tenant-admin.ts`.
- Validation schemas are in `lib/validations/tenant-admin.ts`.
- Tenant admin API routes are under `app/api/tenant/admin`.
- Restaurant admin can save an organization logo URL and location QR/menu slug.
- Migration `drizzle/0007_location_qr_slug.sql` adds `locations.qr_slug`.
- The QR slug UI currently produces `/order?qr=...`; full public tenant resolution by QR slug belongs in Phase 4 with tenant-aware customer order loading.
- Restaurant staff invitations use `staff_invitations`, `app/api/tenant/admin/staff/invite`, `app/api/invitations/accept`, and `/invite`.
- Invitation tokens are stored as hashes and expire after 7 days.
- Migration `drizzle/0006_staff_invitations.sql` adds the invitation token table.
- The next Phase 3 increment should add audit logs for tenant and staff management actions.

## Phase 4: Operational Modules

Status: Partially started in MVP, not tenant-aware

Goal: Convert current POS functionality into tenant-aware, reusable modules.

Tasks:

- [ ] Refactor current menu manager into tenant/location-aware module.
- [ ] Refactor order board into location-aware module.
- [ ] Refactor customer order page to load by location QR/link.
- [ ] Add QR/menu links per location.
- [ ] Add inventory module per restaurant/location.
- [ ] Support out-of-stock or hidden products by location.
- [ ] Decide order numbering strategy: global, tenant, location, or daily location sequence.
- [ ] Keep item-level order status workflow.
- [ ] Add reusable components for order item rows across customer and staff views.

Current refactor candidates:

- `components/order/OrderForm.tsx`
- `components/order/CustomerOrderStatus.tsx`
- `components/staff/StaffOrderBoard.tsx`
- `components/staff/OrderCard.tsx`
- `components/staff/MenuManager.tsx`

## Phase 5: Reporting And Company Dashboards

Status: Not started

Goal: Give parent companies and restaurants visibility into performance.

Tasks:

- [ ] Parent company summary across all child restaurants.
- [ ] Restaurant-level reports.
- [ ] Location-level reports.
- [ ] Orders by date, status, drink, category, location and staff member.
- [ ] Prep time and collection/delivery time reports.
- [ ] Cancelled/refused item reports.
- [ ] Top products and low-performing products.
- [ ] Revenue/price reports once pricing is reliable.
- [ ] CSV export.
- [ ] Later: PDF export.

Important:

- Reporting should read from tenant-scoped views or service functions, not raw unscoped queries.

## Phase 6: SaaS Commercial Layer

Status: Not started

Goal: Add subscription and onboarding capability once product structure is stable.

Tasks:

- [ ] Tenant onboarding flow.
- [ ] Plans and billing.
- [ ] Usage limits for restaurants, locations, users, orders and storage.
- [ ] Trial accounts.
- [ ] Subscription status handling.
- [ ] Suspended tenant handling.
- [ ] Platform-level SaaS metrics.
- [ ] Data export and account deletion workflows.

## Phase 7: Scale, Security And Reliability

Status: Not started

Goal: Make the platform production-ready for multiple customers and heavier usage.

Tasks:

- [ ] Add strict server-side tenant guards everywhere.
- [ ] Consider Supabase Row Level Security as defense in depth.
- [ ] Add audit logs for admin, user, menu and order changes.
- [ ] Replace constant polling with Supabase Realtime or adaptive polling.
- [ ] Add request cancellation/locking to prevent overlapping polling calls.
- [ ] Add rate limiting.
- [ ] Add structured error logging.
- [ ] Add automated tests for tenant isolation and order transitions.
- [ ] Add backups and restore plan.
- [ ] Add tenant-scoped image uploads and storage limits.

## Recommended Immediate Next Step

Continue Phase 3 with audit logs and access tests.

Implementation order:

1. Add audit logs for tenant and staff management actions.
2. Add automated tests for tenant isolation and location switching.
3. Add optional email delivery for invitation links when SMTP/provider details are available.

## Notes For Future Chat Sessions

- Do not start with billing, reporting or dashboards until Phase 1 tenant foundations exist.
- Do not trust tenant or location IDs sent by the browser without checking session membership.
- Prefer moving business rules out of route handlers into service functions before adding more features.
- Keep migrations backward compatible where possible.
- Use `npm run db:migrate` for normal migration application and `npm run db:reset:migrate` only for intentional clean dev resets.
- Avoid manual Supabase SQL copy-paste for multi-step migrations because enum changes must commit before newly added enum values can be used.
- Avoid relying on `npm run db:push` as the main setup path while Drizzle introspection is failing against the current Supabase schema.
- Run `npm run lint` and `npm run build` after implementation work.
- The user prefers to run `npm` directly in their terminal; internal Windows tool runs may use `npm.cmd`.
