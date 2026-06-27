import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { acceptStaffInvitation } from "@/lib/invitations";

export async function POST(request: Request) {
  try {
    await acceptStaffInvitation(await request.json());

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to accept invitation." },
      { status: 400 },
    );
  }
}
