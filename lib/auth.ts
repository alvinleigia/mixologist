import { auth } from "@/auth";

export async function requireMixologistSession() {
  const session = await auth();

  if (!session?.user || session.user.role !== "MIXOLOGIST") {
    return null;
  }

  return session;
}
