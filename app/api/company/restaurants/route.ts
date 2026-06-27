import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth";
import { companyAdminRoles } from "@/lib/role-access";
import { createChildRestaurant, listCompanyRestaurants } from "@/lib/saas-admin";

export async function GET() {
  const session = await requireRole([...companyAdminRoles]);

  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    restaurants: await listCompanyRestaurants(session.user.organizationId),
  });
}

export async function POST(request: Request) {
  const session = await requireRole([...companyAdminRoles]);

  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await createChildRestaurant(session.user.organizationId, await request.json());
    return NextResponse.json({
      restaurants: await listCompanyRestaurants(session.user.organizationId),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create restaurant." },
      { status: 500 },
    );
  }
}
