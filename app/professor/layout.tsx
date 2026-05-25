import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { requireRole } from "@/src/lib/auth/require-role";
import { ProfessorSidebarNav } from "@/src/components/dashboard/AdminSidebarNav";
import { UserDropdown } from "@/src/components/layout/Header/UserDropdown";

type ProfessorLayoutProps = {
  children: ReactNode;
};

export default async function ProfessorLayout({
  children,
}: ProfessorLayoutProps) {
  const session = await requireRole("PROFESSOR");

  return (
    <div className="h-screen bg-slate-50 text-slate-900">
      <div className="flex h-screen">
        <aside className="hidden w-72 shrink-0 bg-[#031b46] text-white lg:flex lg:flex-col">
          <div className="flex w-full items-center px-6 py-4">
            <Link href="/">
              <Image
                src="/images/ula-logo-white.png"
                width={270}
                height={72}
                alt="ULA Logo"
                className="w-50"
                loading="eager"
              />
            </Link>
          </div>

          <ProfessorSidebarNav />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </button>

              <div>
                <h1 className="text-xl font-bold text-[#031b46] md:text-2xl">
                  Panel de Profesor
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <UserDropdown user={session.user} />
            </div>
          </header>

          <main className="flex-1 overflow-auto px-4 py-6 md:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
