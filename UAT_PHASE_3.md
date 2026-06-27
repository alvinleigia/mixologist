# Foodie POS UAT Checklist Through Phase 3

Use this checklist to test the SaaS foundation completed through Phase 3. This UAT does not cover full QR-based tenant-aware customer ordering yet; that belongs to Phase 4.

## Tester Workflow Path

Start here if you are testing the SaaS app manually. This path begins with the SaaS owner and then moves down the tenant hierarchy.

### Workflow -1: Prepare Development Database

If you want a clean test database before UAT, run:

```powershell
npm run db:reset:migrate
```

Expected: terminal ends with `Database migrations complete.`

Important: this clears the full development `public` schema. Do not run it against production.

### Workflow 0: Create SaaS Owner Login

Add these values to `.env.local` if they are not already present.

```env
PLATFORM_OWNER_USERNAME="owner"
PLATFORM_OWNER_EMAIL="owner@example.com"
PLATFORM_OWNER_PASSWORD="choose-a-local-password"
```

Then run:

```powershell
npm run db:bootstrap:platform
```

Expected: terminal shows `Platform owner verified: owner`.

### Workflow 1: SaaS Owner Login

URL: `http://localhost:3000/staff/login`

- [ ] Enter wrong SaaS owner username/password.

Expected: Login fails.

- [ ] Enter correct SaaS owner credentials from `.env.local`.

```text
Username: PLATFORM_OWNER_USERNAME
Password: PLATFORM_OWNER_PASSWORD
```

Expected: Login succeeds.

- [ ] Open `http://localhost:3000/platform`.

Expected: Platform admin dashboard loads.

### Workflow 2: SaaS Owner Creates Parent Company

URL: `http://localhost:3000/platform`

- [ ] Create a parent company.

Example:

```text
Alvin Leisure Company
```

Expected: Company appears in the parent companies list.

- [ ] Confirm platform summary cards and company activity report are visible.

Expected: Counts/report rows are visible without crashing.

- [ ] Create `COMPANY_OWNER` invite for that company.

Expected: Invite link appears.

- [ ] Copy the invite link and open it in Incognito/private browser.

Expected: Password setup page opens.

- [ ] Set password for the company owner.

Expected: Success message appears.

### Workflow 3: Company Owner Creates Child Restaurant

URL: `http://localhost:3000/staff/login`

- [ ] Login as the invited `COMPANY_OWNER`.

Expected: Login succeeds.

- [ ] Open `http://localhost:3000/company`.

Expected: Company dashboard loads.

- [ ] Create a child restaurant with location details.

Example:

```text
Restaurant: AGO
Location: Main Bar
```

Expected: Restaurant appears in the child restaurants list.

- [ ] Confirm company summary cards and restaurant activity report are visible.

Expected: Counts/report rows are visible without crashing.

- [ ] Create `RESTAURANT_MANAGER` invite for the child restaurant.

Expected: Invite link appears.

- [ ] Copy the invite link and open it in Incognito/private browser.

Expected: Password setup page opens.

- [ ] Set password for the restaurant manager.

Expected: Success message appears.

### Workflow 4: Restaurant Manager Sets Up Restaurant

URL: `http://localhost:3000/staff/login`

- [ ] Login as the invited `RESTAURANT_MANAGER`.

Expected: Login succeeds.

- [ ] Open `http://localhost:3000/restaurant`.

Expected: Restaurant admin loads.

- [ ] Change restaurant name, timezone and currency.

Expected: Save succeeds and values remain after refresh.

- [ ] Add a logo URL.

Expected: Logo preview appears.

- [ ] Add location name, label and timezone.

Expected: Save succeeds and values remain after refresh.

- [ ] Add QR/menu slug.

Example:

```text
main-bar
```

Expected: Link preview appears as `/order?qr=main-bar`.

- [ ] Click copy link.

Expected: Full local URL is copied.

### Workflow 5: Restaurant Manager Invites Order Operator

URL: `http://localhost:3000/restaurant`

- [ ] In the staff invite form, create an `ORDER_OPERATOR` invite.

Expected: Invite link appears.

- [ ] Copy invite link and open it in Incognito/private browser.

Expected: Password setup page opens.

- [ ] Set password with at least 8 characters.

Expected: Success message appears.

- [ ] Login with the invited order operator username/password at `http://localhost:3000/staff/login`.

Expected: Order operator can access `/staff`.

- [ ] Try opening `http://localhost:3000/restaurant`.

Expected: Access denied or redirect because `ORDER_OPERATOR` should not manage admin.

### Workflow 6: Restaurant Manager Builds Menu

URL: `http://localhost:3000/staff`

- [ ] Login as restaurant manager if needed.

Expected: `/staff` loads.

- [ ] Open Menu Manager.

Expected: Menu manager loads.

- [ ] Add category.

Expected: Category appears.

- [ ] Add product with name, price, description and image URL.

Expected: Product appears.

- [ ] Edit product.

Expected: Changes save.

- [ ] Open `http://localhost:3000/order`.

Expected: Active product appears for customer.

### Workflow 7: Customer Places Order

URL: `http://localhost:3000/order`

- [ ] Enter customer name.

Expected: Customer name is required and accepted.

- [ ] Add two drinks to cart.

Expected: Cart count updates.

- [ ] Change quantity and add notes.

Expected: Quantity and notes persist.

- [ ] Review order.

Expected: Confirmation modal shows order summary.

- [ ] Confirm order.

Expected: Order is placed and recent order status appears.

### Workflow 8: Order Operator Handles Order

URL: `http://localhost:3000/staff`

- [ ] Login as order operator.

Expected: Orders panel loads.

- [ ] Confirm new customer order appears under active orders.

Expected: Order is visible.

- [ ] Mark item as preparing.

Expected: Item status changes.

- [ ] Mark item as ready.

Expected: Item status changes.

- [ ] Play message if available.

Expected: No error occurs.

- [ ] Mark item delivered.

Expected: Order moves toward past/completed state.

- [ ] Cancel an item/order.

Expected: Cancelled state appears correctly.

### Workflow 9: Clear Testing Orders

URL: `http://localhost:3000/staff`

- [ ] Login as restaurant manager or allowed staff.

Expected: Orders panel loads.

- [ ] Click `Clear All Orders`.

Expected: Confirmation appears.

- [ ] Try confirming without typing `delete`.

Expected: Clear action is blocked.

- [ ] Type `delete`.

Expected: Orders are cleared.

- [ ] Go back to `http://localhost:3000/order`.

Expected: Old local customer status clears/syncs after refresh.

### Workflow 10: Security Checks

- [ ] `PLATFORM_ADMIN` can access `/platform`.
- [ ] `COMPANY_OWNER` can access `/company`.
- [ ] `RESTAURANT_MANAGER` can access `/restaurant` and `/staff`.
- [ ] `ORDER_OPERATOR` can access `/staff`.
- [ ] `ORDER_OPERATOR` cannot access `/restaurant`, `/company`, or `/platform`.
- [ ] Logged-out user cannot access admin pages.
- [ ] Customer can access `/order` without login.

Known limitation:

- `/order?qr=main-bar` is not fully tenant-aware yet. That will be implemented in Phase 4.

## Before Testing

- [ ] Run the app locally.

```powershell
npm run dev
```

- [ ] Confirm Node is LTS.

```powershell
node -v
```

Expected: `v22.x`

- [ ] Confirm required local environment values exist in `.env.local`.

Required values:

- `DATABASE_URL`
- `AUTH_SECRET`
- `PLATFORM_OWNER_USERNAME`
- `PLATFORM_OWNER_EMAIL`
- `PLATFORM_OWNER_PASSWORD`

- [ ] If login fails after changing `AUTH_SECRET`, clear localhost browser cookies and sign in again.

## Login And Route Access

### SaaS Owner Login

- [ ] Open `/staff/login`.
- [ ] Login using:

```text
Username: PLATFORM_OWNER_USERNAME from .env.local
Password: PLATFORM_OWNER_PASSWORD from .env.local
```

- [ ] Confirm successful login redirects to the platform/admin area.
- [ ] Confirm wrong password shows an error and does not login.

### Route Access

- [ ] Open `/platform`.
- [ ] Confirm platform admin page loads for the bootstrap SaaS owner.
- [ ] Open `/company`.
- [ ] Confirm access is blocked until a company owner/manager account is created through invite flow.
- [ ] Open `/restaurant`.
- [ ] Confirm access is blocked until a restaurant manager account is created through invite flow.
- [ ] Open `/staff`.
- [ ] Confirm access is blocked until a location-level staff membership is created through invite flow.
- [ ] Open `/order`.
- [ ] Confirm customer order page loads without login.

## Restaurant Admin UAT

Route: `/restaurant`

### Restaurant Settings

- [ ] Update restaurant name.
- [ ] Update timezone.
- [ ] Update currency.
- [ ] Add a valid logo URL.
- [ ] Confirm logo preview appears.
- [ ] Save settings.
- [ ] Refresh page and confirm values persist.
- [ ] Try an invalid logo URL and confirm validation prevents save.

### Location Settings

- [ ] Update location name.
- [ ] Update location label.
- [ ] Update timezone.
- [ ] Add QR/menu slug, for example:

```text
main-bar
```

- [ ] Confirm customer QR link preview appears as:

```text
/order?qr=main-bar
```

- [ ] Click copy link.
- [ ] Paste somewhere and confirm it copied the full local URL.
- [ ] Save settings.
- [ ] Refresh page and confirm QR slug persists.
- [ ] Try an invalid QR slug, such as `Main Bar!`, and confirm validation blocks it.

Known Phase 4 note:

- `/order?qr=...` currently copies/saves the slug, but public order loading by QR slug is not fully tenant-aware until Phase 4.

## Restaurant Staff Invite UAT

Route: `/restaurant`

- [ ] Fill the staff invite form with username, name, email and role.
- [ ] Select `ORDER_OPERATOR`.
- [ ] Click `Create Invite`.
- [ ] Confirm an invitation link appears.
- [ ] Copy the invite link.
- [ ] Open the link in incognito/private browser.
- [ ] Confirm `/invite?token=...` page shows set password form.
- [ ] Set a password with at least 8 characters.
- [ ] Confirm success message appears.
- [ ] Open `/staff/login`.
- [ ] Login with the invited username and new password.
- [ ] Confirm invited order operator can access `/staff`.
- [ ] Confirm invited order operator should not access `/restaurant` unless role allows it.

### Invalid Invite Checks

- [ ] Open `/invite` without a token.
- [ ] Confirm it shows invalid invitation.
- [ ] Reuse an accepted invite link.
- [ ] Confirm it no longer allows setting password again.

## Direct Staff Creation UAT

Route: `/restaurant`

- [ ] Create a staff user using the direct staff creation form.
- [ ] Use a password with at least 8 characters.
- [ ] Confirm staff appears in staff list.
- [ ] Logout.
- [ ] Login with the new staff username/password.
- [ ] Confirm access matches role.

### Staff Management

- [ ] Change a staff role.
- [ ] Confirm the role updates in the list.
- [ ] Disable a staff membership.
- [ ] Confirm disabled staff can no longer access protected pages.
- [ ] Enable the staff membership again.
- [ ] Confirm access is restored.

## Platform Admin UAT

Route: `/platform`

Only test this with a `PLATFORM_ADMIN` account.

### Parent Company Management

- [ ] Create a parent company.
- [ ] Confirm it appears in the parent companies list.
- [ ] Disable the company.
- [ ] Confirm status/action updates.
- [ ] Enable the company again.

### Platform Invite Links

- [ ] For a company, create invite for `COMPANY_OWNER`.
- [ ] Confirm invite link appears.
- [ ] Copy invite link.
- [ ] Open in incognito/private browser.
- [ ] Set password.
- [ ] Login as invited company owner.
- [ ] Confirm access to `/company`.

### Platform Reports

- [ ] Confirm summary cards show:

- Companies
- Restaurants
- Active orders
- Locations
- Staff memberships
- Non-cancelled orders

- [ ] Confirm company activity breakdown appears.
- [ ] Confirm each row shows restaurants, locations, staff, active orders, non-cancelled orders, cancelled orders and last order time.

## Company Admin UAT

Route: `/company`

Only test this with `COMPANY_OWNER`, `COMPANY_MANAGER`, or `PLATFORM_ADMIN`.

### Child Restaurant Management

- [ ] Create a child restaurant with location name.
- [ ] Confirm the child restaurant appears in list.
- [ ] Disable the restaurant.
- [ ] Confirm status/action updates.
- [ ] Enable the restaurant again.

### Company Invite Links

- [ ] For a child restaurant, create invite for `RESTAURANT_MANAGER`.
- [ ] Confirm invite link appears.
- [ ] Copy invite link.
- [ ] Open in incognito/private browser.
- [ ] Set password.
- [ ] Login as invited restaurant manager.
- [ ] Confirm access to `/restaurant`.

- [ ] Create invite for `ORDER_OPERATOR`.
- [ ] Login as invited order operator.
- [ ] Confirm access to `/staff`.
- [ ] Confirm order operator does not access `/restaurant`.

### Company Reports

- [ ] Confirm summary cards show:

- Restaurants
- Locations
- Active orders
- Staff memberships
- Non-cancelled orders

- [ ] Confirm restaurant activity breakdown appears.
- [ ] Confirm each row shows locations, staff, active orders, non-cancelled orders, cancelled orders and last order time.

## Location Switching UAT

Use a user with memberships in more than one location.

- [ ] Login as the multi-location user.
- [ ] Confirm location switcher appears in admin/operations header.
- [ ] Switch location.
- [ ] Confirm page updates without crashing.
- [ ] Confirm order/menu/admin operations are scoped to the selected location.
- [ ] Logout and login again.
- [ ] Confirm session remains valid.

## Menu Manager Smoke Test

Route: `/staff`

- [ ] Open Menu Manager.
- [ ] Create category.
- [ ] Create product.
- [ ] Edit product.
- [ ] Confirm product appears on `/order`.
- [ ] Hide/deactivate product if available.
- [ ] Confirm product no longer appears to customers.

## Orders Smoke Test

Route: `/order` and `/staff`

- [ ] Open `/order`.
- [ ] Enter customer name.
- [ ] Add multiple products to cart.
- [ ] Change quantity.
- [ ] Add item note.
- [ ] Review order.
- [ ] Confirm order.
- [ ] Open `/staff`.
- [ ] Confirm order appears on active board.
- [ ] Mark individual item preparing/ready/delivered/cancelled where available.
- [ ] Confirm customer order status updates.
- [ ] Confirm completed/cancelled orders move to past/history where expected.

## Clear Orders UAT

Route: `/staff`

- [ ] Click clear all orders.
- [ ] Confirm first warning appears.
- [ ] Confirm second protection requires typing `delete`.
- [ ] Type wrong text and confirm clear is blocked.
- [ ] Type `delete`.
- [ ] Confirm orders are cleared.
- [ ] Open customer page and confirm local status clears after server reset flag syncs.

## Security And Regression Checks

- [ ] Logged-out user cannot access `/staff`, `/restaurant`, `/company`, or `/platform`.
- [ ] Customer can access `/order` without login.
- [ ] `ORDER_OPERATOR` role cannot access `/restaurant`, `/company`, or `/platform`.
- [ ] `RESTAURANT_MANAGER` can access `/restaurant` and `/staff`.
- [ ] `COMPANY_OWNER` or `COMPANY_MANAGER` can access `/company`.
- [ ] `PLATFORM_ADMIN` can access `/platform`.
- [ ] Staff from one restaurant should not see another restaurant's operational data.
- [ ] Invite links cannot be accepted twice.
- [ ] Invalid/expired invite links show an error.

## Known Deferrals After Phase 3

- Email delivery for invite links is not implemented yet because SMTP/provider details are not configured.
- `/order?qr=...` public tenant resolution is not complete yet. This is planned for Phase 4.
- Full inventory module is not implemented yet.
- Audit logs are not implemented yet.
- Automated tenant isolation tests are not implemented yet.
- Production Supabase RLS is not configured yet.

## UAT Result Log

Use this section while testing.

| Date | Tester | Area | Result | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
