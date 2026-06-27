import { NextResponse } from "next/server";

import { getPublicMenu } from "@/lib/menu";
import { getCurrentTenantContext } from "@/lib/tenant-context";

export async function GET() {
  try {
    const tenantContext = await getCurrentTenantContext();
    const categories = await getPublicMenu(tenantContext);
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch menu." },
      { status: 500 },
    );
  }
}
