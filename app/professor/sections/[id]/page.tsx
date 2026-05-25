import { ProfessorSectionDetailClient } from "./ProfessorSectionDetailClient";

type ProfessorSectionDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfessorSectionDetailPage({
  params,
}: ProfessorSectionDetailPageProps) {
  const { id } = await params;

  return <ProfessorSectionDetailClient sectionId={id} />;
}
