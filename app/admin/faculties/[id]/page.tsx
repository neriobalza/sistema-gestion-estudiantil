import { requireAdmin } from "@/src/lib/auth/require-admin";
import { FacultyDetailClient } from "./FacultyDetailClient";

type FacultyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function FacultyDetailPage({
  params,
}: FacultyDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  return <FacultyDetailClient facultyId={id} />;
}
