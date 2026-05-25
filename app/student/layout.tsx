import type { PropsWithChildren } from "react";
import { requireRole } from "@/src/lib/auth/require-role";

export default async function StudentLayout({ children }: PropsWithChildren) {
  await requireRole("STUDENT");

  return children;
}
