import type { PropsWithChildren } from "react";
import { requireRole } from "@/src/lib/auth/require-role";

export default async function ProfessorLayout({ children }: PropsWithChildren) {
  await requireRole("PROFESSOR");

  return children;
}
