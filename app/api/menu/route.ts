import { NextResponse } from "next/server";

import { getPublicMenu } from "@/lib/menu";
import { getPublicTenantContextFromRequest } from "@/lib/tenant-context";

export async function GET(request: Request) {
  try {
    const tenantContext = await getPublicTenantContextFromRequest(request);
    const categories = await getPublicMenu(tenantContext);
    return NextResponse.json({ categories });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch menu." },
      { status: 500 },
    );
  }
}
