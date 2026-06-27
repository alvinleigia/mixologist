# Foodie POS

Foodie POS is a Next.js restaurant order operations MVP being evolved into a multi-tenant SaaS app for parent companies, restaurants, locations and staff users.

## Current Status

- Customer order page with cart and recent order status.
- Staff operations panel with item-level order workflow.
- Menu manager for categories and products.
- Restaurant admin route for restaurant settings, location settings and staff access.
- Dedicated SaaS admin route shells at `/platform`, `/company` and `/restaurant`.
- Platform admin can create/manage parent company tenants.
- Company admin can create/manage child restaurant tenants with default locations.
- Platform admin can directly create company owner/manager users.
- Company admin can create restaurant manager/order operator invite links.
- Users with multiple active location memberships can switch location context from the admin/operations header.
- Platform/company dashboards show first summary cards for tenants, locations, staff and order activity.
- Restaurant admins can create staff invitation links so invited users set their own password.
- Supabase/Postgres database via Drizzle.
- Auth.js credentials login backed by database users.
- Tenant foundation with organizations, locations and memberships.

See [SAAS_ROADMAP.md](./SAAS_ROADMAP.md) for the active phased implementation tracker.

## Environment

Create `.env.local` from `.env.example`:

```bash
DATABASE_URL="postgresql://user:password@host:6543/postgres"
AUTH_SECRET="replace-with-a-long-random-secret"
PLATFORM_OWNER_USERNAME="owner"
PLATFORM_OWNER_EMAIL="owner@example.com"
PLATFORM_OWNER_PASSWORD="change-me"
```

`PLATFORM_OWNER_USERNAME`, `PLATFORM_OWNER_EMAIL` and `PLATFORM_OWNER_PASSWORD` are used only to bootstrap the first SaaS owner. All company, restaurant and staff users should then be created through the platform/company/restaurant admin flows.

## Setup

Install dependencies:

```bash
npm install
```

Apply migrations from the committed SQL files:

```bash
npm run db:migrate
```

For a clean development reset, run the reset-and-migrate command. This deletes the full `public` schema, so use it only for test/dev databases:

```bash
npm run db:reset:migrate
```

Avoid using `npm run db:push` as the normal setup path. It depends on Drizzle database introspection and has been fragile with enum changes on Supabase.

Bootstrap or verify the SaaS owner:

```bash
npm run db:bootstrap:platform
```

Verify tenant foundation:

```bash
npm run db:verify:tenant
```

Start development:

```bash
npm run dev
```

Open:

- Customer order page: `http://localhost:3000/order`
- Staff operations: `http://localhost:3000/staff`
- Restaurant admin: `http://localhost:3000/restaurant`
- Company admin shell: `http://localhost:3000/company`
- Platform admin shell: `http://localhost:3000/platform`

## Verification

Run before commits or deploys:

```bash
npm run lint
npm run build
```

## SaaS Notes

- The current MVP data belongs to a hidden default company, restaurant and location.
- Protected staff routes resolve tenant/location from the signed-in user membership.
- Restaurant-level tenant admin APIs are protected by role checks and scoped to the signed-in membership.
- `/platform`, `/company` and `/restaurant` are role-protected SaaS admin route shells.
- Platform/company admin users can authenticate without a location-level membership.
- Direct staff creation is implemented; restaurant staff invitation links are implemented; email delivery is still planned.
- Location switching validates active memberships before updating the session.
- Invitation tokens are stored as hashes and expire after 7 days.
- Dashboard summaries are scoped by platform/company access before returning counts.
- Public customer routes currently use the default MVP tenant until QR/location routing is introduced.
- Inventory is intentionally deferred until the inventory module is designed.
