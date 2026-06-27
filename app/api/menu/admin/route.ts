import { NextResponse } from "next/server";

import { requireStaffSession } from "@/lib/auth";
import { getAdminMenu } from "@/lib/menu";
import { getCurrentTenantContext } from "@/lib/tenant-context";

export async function GET() {
  try {
    const session = await requireStaffSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantContext();
    const categories = await getAdminMenu(tenantContext);
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch admin menu." },
      { status: 500 },
    );
  }
}
