import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { platformAdminRoles } from "@/lib/role-access";
import {
  getPlatformCompanyBreakdown,
  getPlatformSummary,
} from "@/lib/saas-reports";

export async function GET() {
  const session = await requireRole([...platformAdminRoles]);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [summary, breakdown] = await Promise.all([
    getPlatformSummary(),
    getPlatformCompanyBreakdown(),
  ]);

  return NextResponse.json({ summary, breakdown });
}
