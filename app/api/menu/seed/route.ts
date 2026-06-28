import { NextResponse } from "next/server";

import { requireMenuManagerSession } from "@/lib/auth";
import { getAdminMenu, seedStarterMenu } from "@/lib/menu";
import { getCurrentTenantContext } from "@/lib/tenant-context";

export async function POST() {
  try {
    const session = await requireMenuManagerSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantContext = await getCurrentTenantContext();
    const summary = await seedStarterMenu(tenantContext);

    if (summary.skipped) {
      return NextResponse.json(
        {
          error: "Starter menu can only be seeded into an empty menu.",
          categories: await getAdminMenu(tenantContext),
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      categories: await getAdminMenu(tenantContext),
      summary,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed starter menu." },
      { status: 500 },
    );
  }
}
