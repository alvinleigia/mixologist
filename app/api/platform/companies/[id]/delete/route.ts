import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit-log";
import { deleteCompanyTenant } from "@/lib/company-data-export";
import { platformAdminRoles } from "@/lib/role-access";
import { listPlatformCompanies } from "@/lib/saas-admin";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await requireRole([...platformAdminRoles]);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);

  if (!payload || payload.confirmation !== "DELETE") {
    return NextResponse.json(
      { error: "Type DELETE to confirm company deletion." },
      { status: 400 },
    );
  }

  const { id } = await props.params;
  const deleted = await deleteCompanyTenant(id);

  if (!deleted) {
    return NextResponse.json({ error: "Company not found." }, { status: 404 });
  }

  await writeAuditLog({
    actor: session.user,
    organizationId: null,
    action: "platform.company.delete",
    entityType: "organization",
    entityId: deleted.id,
    metadata: {
      name: deleted.name,
      confirmedWith: "DELETE",
    },
  });

  return NextResponse.json({
    deleted,
    companies: await listPlatformCompanies(),
  });
}
