import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth";
import {
  getTenantAdminSnapshot,
  updateStaffMembership,
} from "@/lib/tenant-admin";
import { getCurrentTenantContext } from "@/lib/tenant-context";

const tenantAdminRoles = [
  "PLATFORM_ADMIN",
  "COMPANY_OWNER",
  "COMPANY_MANAGER",
  "RESTAURANT_MANAGER",
] as const;

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ membershipId: string }> },
) {
  try {
    const session = await requireRole([...tenantAdminRoles]);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { membershipId } = await context.params;
    const tenantContext = await getCurrentTenantContext();
    const membership = await updateStaffMembership(
      tenantContext,
      membershipId,
      await request.json(),
    );

    if (!membership) {
      return NextResponse.json({ error: "Staff membership not found." }, { status: 404 });
    }

    return NextResponse.json(await getTenantAdminSnapshot(tenantContext));
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update staff user." },
      { status: 500 },
    );
  }
}
