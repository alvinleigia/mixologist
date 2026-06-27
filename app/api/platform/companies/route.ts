import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth";
import { platformAdminRoles } from "@/lib/role-access";
import { createCompanyOrganization, listPlatformCompanies } from "@/lib/saas-admin";

export async function GET() {
  const session = await requireRole([...platformAdminRoles]);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({ companies: await listPlatformCompanies() });
}

export async function POST(request: Request) {
  const session = await requireRole([...platformAdminRoles]);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await createCompanyOrganization(await request.json());
    return NextResponse.json({ companies: await listPlatformCompanies() });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create company." },
      { status: 500 },
    );
  }
}
