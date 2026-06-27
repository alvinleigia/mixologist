# Login Credentials And Admin Routes

This file tracks the staff login model and main routes. Do not store real passwords or production secrets in this file.

## Bootstrap Logins

Only the first SaaS owner is bootstrapped from `.env.local`.

### SaaS Owner / Platform Admin

Use this account to start full SaaS UAT from the top of the hierarchy.

| Field | Source |
| --- | --- |
| Username | `PLATFORM_OWNER_USERNAME` |
| Password | `PLATFORM_OWNER_PASSWORD` |
| Email | `PLATFORM_OWNER_EMAIL` |
| Role | `PLATFORM_ADMIN` |
| Main route | `/platform` |

Create or verify it with:

```powershell
npm run db:bootstrap:platform
```

Restaurant managers, company users and order operators should be created from the SaaS admin flow using invite links. There is no default staff bootstrap account.

## Roles

| Role | Purpose | Main access |
| --- | --- | --- |
| `PLATFORM_ADMIN` | Parent SaaS/company admin | Platform, company, restaurant, and operations areas |
| `COMPANY_OWNER` | Company owner for multiple restaurants | Company, restaurant, and operations areas |
| `COMPANY_MANAGER` | Company manager for multiple restaurants | Company, restaurant, and operations areas |
| `RESTAURANT_MANAGER` | Restaurant/location admin | Restaurant admin and operations areas |
| `ORDER_OPERATOR` | Staff/order operator | Operations area only |

## Main Routes

| Route | Purpose | Allowed roles |
| --- | --- | --- |
| `/order` | Customer order page | Public, no login |
| `/staff/login` | Staff login page | Public login page |
| `/staff` | Live order operations and menu manager | `PLATFORM_ADMIN`, `COMPANY_OWNER`, `COMPANY_MANAGER`, `RESTAURANT_MANAGER`, `ORDER_OPERATOR` |
| `/restaurant` | Restaurant tenant admin area | `PLATFORM_ADMIN`, `COMPANY_OWNER`, `COMPANY_MANAGER`, `RESTAURANT_MANAGER` |
| `/company` | Company admin area for multiple restaurants | `PLATFORM_ADMIN`, `COMPANY_OWNER`, `COMPANY_MANAGER` |
| `/platform` | Parent SaaS/platform admin area | `PLATFORM_ADMIN` |
| `/invite?token=...` | Staff invitation acceptance page | Public invite link |

## Login Notes

- Staff authentication uses Auth.js credentials login.
- Sessions use JWT cookies encrypted with `AUTH_SECRET`.
- If `AUTH_SECRET` changes, existing browser sessions become invalid. Clear localhost cookies and sign in again.
- Invited staff set their password through `/invite?token=...`.
- Platform, company and restaurant admins currently create copyable invite links instead of emailing them.
- Customer ordering does not require login.
