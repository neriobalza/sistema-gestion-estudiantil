import { requireRole } from "@/src/lib/auth/require-role";

export async function requireAdmin() {
  return requireRole("ADMIN");
}
