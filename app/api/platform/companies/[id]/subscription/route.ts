import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { updateCompanySubscriptionStatus } from "@/lib/billing";
import { platformAdminRoles } from "@/lib/role-access";
import { listPlatformCompanies } from "@/lib/saas-admin";

const subscriptionStatuses = [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE",
  "SUSPENDED",
  "CANCELLED",
] as const;

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await requireRole([...platformAdminRoles]);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const status = payload?.status;

  if (!subscriptionStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid subscription status." }, { status: 400 });
  }

  const { id } = await props.params;
  const subscription = await updateCompanySubscriptionStatus(id, status);

  if (!subscription) {
    return NextResponse.json({ error: "Subscription not found." }, { status: 404 });
  }

  await writeAuditLog({
    actor: session.user,
    organizationId: id,
    action: "platform.subscription.update",
    entityType: "organization_subscription",
    entityId: subscription.id,
    metadata: {
      organizationId: id,
      status: subscription.status,
    },
  });

  return NextResponse.json({ companies: await listPlatformCompanies() });
}
