"use client";
import Link from "next/link";
import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { usePathname } from "next/navigation";

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "Estudiantes",
    href: "/admin/students",
    icon: Users,
  },
  {
    label: "Profesores",
    href: "/admin/professors",
    icon: Users,
  },
  {
    label: "Facultades",
    href: "/admin/faculties",
    icon: Building2,
  },
  {
    label: "Pensums",
    href: "/admin/curricula",
    icon: FileText,
  },
  {
    label: "Materias",
    href: "/admin/subjects",
    icon: BookOpen,
  },
  {
    label: "Períodos",
    href: "/admin/academic-terms",
    icon: CalendarDays,
  },
  {
    label: "Reclamos",
    href: "/admin/claims",
    icon: ClipboardList,
  },
  {
    label: "Configuración",
    href: "/admin/settings",
    icon: Settings,
  },
];

export function SidebarNav() {
  const path = usePathname();

  return (
    <nav className="flex-1 space-y-2 px-4 py-6">
      {sidebarItems.map((item) => {
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "group flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold transition",
              path == item.href
                ? "bg-white/10 text-amber-400 shadow-sm ring-1 ring-white/5"
                : "text-slate-200 hover:bg-white/10 hover:text-white",
            ].join(" ")}
          >
            <Icon
              className={[
                "h-5 w-5",
                path == item.href
                  ? "text-amber-400"
                  : "text-slate-300 group-hover:text-white",
              ].join(" ")}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
