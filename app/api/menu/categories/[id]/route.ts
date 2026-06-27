import { NextRequest, NextResponse } from "next/server";

import { requireStaffSession } from "@/lib/auth";
import { getAdminMenu, updateMenuCategory } from "@/lib/menu";
import { getCurrentTenantContext } from "@/lib/tenant-context";
import { menuCategorySchema } from "@/lib/validations/menu";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireStaffSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const parsed = menuCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const tenantContext = await getCurrentTenantContext();
    const category = await updateMenuCategory(id, parsed.data, tenantContext);

    if (!category) {
      return NextResponse.json({ error: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({ categories: await getAdminMenu(tenantContext) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update category." },
      { status: 500 },
    );
  }
}
