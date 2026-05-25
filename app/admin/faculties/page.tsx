import { requireAdmin } from "@/src/lib/auth/require-admin";
import { FacultiesAdminClient } from "./FacultiesAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminFacultiesPage() {
  await requireAdmin();

  return <FacultiesAdminClient />;
}
