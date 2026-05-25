import type { Role } from "@/src/generated/prisma/enums";

const dashboardRoutes = {
  ADMIN: "/admin",
  PROFESSOR: "/professor",
  STUDENT: "/student",
} as const satisfies Record<Role, string>;

export function getDashboardRoute(role: Role) {
  return dashboardRoutes[role];
}
