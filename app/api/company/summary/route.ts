import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { companyAdminRoles } from "@/lib/role-access";
import {
  getCompanyRestaurantBreakdown,
  getCompanySummary,
} from "@/lib/saas-reports";

export async function GET() {
  const session = await requireRole([...companyAdminRoles]);

  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [summary, breakdown] = await Promise.all([
    getCompanySummary(session.user.organizationId),
    getCompanyRestaurantBreakdown(session.user.organizationId),
  ]);

  return NextResponse.json({ summary, breakdown });
}
