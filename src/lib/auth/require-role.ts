import { auth } from "@/auth";
import type { Role } from "@/src/generated/prisma/enums";
import { getDashboardRoute } from "@/src/lib/auth/dashboard-route";
import { redirect } from "next/navigation";

export async function requireRole(role: Role) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== role) {
    redirect(getDashboardRoute(session.user.role));
  }

  return session;
}
