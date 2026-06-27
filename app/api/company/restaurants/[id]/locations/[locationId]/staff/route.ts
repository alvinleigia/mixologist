import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { requireRole } from "@/lib/auth";
import { createChildRestaurantStaffInvitation } from "@/lib/invitations";
import { companyAdminRoles } from "@/lib/role-access";
import { listCompanyRestaurants } from "@/lib/saas-admin";

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; locationId: string }> },
) {
  const session = await requireRole([...companyAdminRoles]);

  if (!session?.user.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, locationId } = await props.params;
    const origin = new URL(request.url).origin;
    const invitation = await createChildRestaurantStaffInvitation(
      session.user.organizationId,
      id,
      locationId,
      await request.json(),
      origin,
    );

    return NextResponse.json({
      restaurants: await listCompanyRestaurants(session.user.organizationId),
      inviteUrl: invitation.inviteUrl,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create location staff.",
      },
      { status: 500 },
    );
  }
}
