// src/app/admin/page.tsx

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  UserPlus,
  Users,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";

const quickActions = [
  {
    title: "Crear usuario",
    description: "Registrar nuevo usuario",
    href: "/admin/users/new",
    icon: UserPlus,
  },
  {
    title: "Registrar facultad",
    description: "Agregar nueva facultad",
    href: "/admin/faculties?create=faculty",
    icon: Building2,
  },
  {
    title: "Crear escuela",
    description: "Agregar nueva escuela",
    href: "/admin/faculties?create=school",
    icon: GraduationCap,
  },
  {
    title: "Asignar pensum",
    description: "Asignar pensum a escuela",
    href: "/admin/curricula",
    icon: FileText,
  },
  {
    title: "Abrir período",
    description: "Crear nuevo período académico",
    href: "/admin/academic-terms/new",
    icon: CalendarDays,
  },
  {
    title: "Ver reportes",
    description: "Consultar reportes del sistema",
    href: "/admin/reports",
    icon: BookOpen,
  },
];

const pendingItems = [
  {
    label: "Solicitudes de registro de estudiantes",
    count: 12,
  },
  {
    label: "Solicitudes de docentes",
    count: 6,
  },
  {
    label: "Asignación de pensums pendientes",
    count: 4,
  },
  {
    label: "Aprobación de períodos académicos",
    count: 2,
  },
];

type RecentActivity = {
  title: string;
  description: string;
  time: string;
};

const recentActivity: RecentActivity[] = [];

const chartData = [
  {
    month: "Dic 2024",
    users: 380,
    requests: 240,
  },
  {
    month: "Ene 2025",
    users: 520,
    requests: 320,
  },
  {
    month: "Feb 2025",
    users: 600,
    requests: 360,
  },
  {
    month: "Mar 2025",
    users: 750,
    requests: 450,
  },
  {
    month: "Abr 2025",
    users: 700,
    requests: 400,
  },
  {
    month: "May 2025",
    users: 880,
    requests: 560,
  },
];

export default async function AdminDashboardPage() {
  const [studentsCount, professorsCount, facultiesCount] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.professorProfile.count(),
    prisma.faculty.count(),
  ]);

  const stats = [
    {
      label: "Estudiantes",
      value: formatCount(studentsCount),
      helper: "Registrados en el sistema",
      icon: Users,
    },
    {
      label: "Docentes",
      value: formatCount(professorsCount),
      helper: "Registrados en el sistema",
      icon: GraduationCap,
    },
    {
      label: "Facultades",
      value: formatCount(facultiesCount),
      helper: "Estructura académica activa",
      icon: Building2,
    },
    {
      label: "Solicitudes pendientes",
      value: "0",
      helper: "Sin módulo de solicitudes activo",
      icon: ClipboardList,
    },
  ];

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />

        <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-white/10 bg-white/5" />
        <div className="absolute -right-16 top-20 h-40 w-40 rounded-full border border-white/10 bg-white/5" />

        <div className="relative flex items-center gap-6">
          <div className="hidden h-20 w-20 items-center justify-center rounded-full bg-white/10 text-amber-400 md:flex">
            <Building2 className="h-10 w-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold">Bienvenido, Administrador</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">
              Desde aquí puedes gestionar y controlar los aspectos académicos
              principales de la plataforma.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/10 text-amber-500">
                  <Icon className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#031b46]">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-3xl font-bold text-[#031b46]">
                    {stat.value}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                    {stat.helper}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#031b46]">Gestión rápida</h3>

          <div className="mt-4 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className="group rounded-xl border border-slate-200 p-4 transition hover:border-amber-300 hover:bg-amber-50/40"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#031b46]/5 text-[#031b46] group-hover:bg-amber-400/10 group-hover:text-amber-500">
                      <Icon className="h-6 w-6" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-[#031b46]">
                        {action.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#031b46]">Pendientes</h3>
            <Link
              href="/admin/requests"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todos
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {pendingItems.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/10 text-amber-500">
                    <ClipboardList className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">
                    {item.label}
                  </p>
                </div>

                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#031b46]">
              Actividad del sistema
            </h3>

            <select className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none">
              <option>Últimos 6 meses</option>
              <option>Últimos 12 meses</option>
            </select>
          </div>

          <div className="mt-6 flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-[#031b46]" />
              Usuarios registrados
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm bg-amber-400" />
              Solicitudes procesadas
            </div>
          </div>

          <div className="mt-6 flex h-64 items-end gap-5 border-b border-l border-slate-200 px-4">
            {chartData.map((item) => (
              <div
                key={item.month}
                className="flex h-full flex-1 flex-col justify-end gap-3"
              >
                <div className="flex items-end justify-center gap-2">
                  <div
                    className="w-5 rounded-t-md bg-[#031b46]"
                    style={{ height: `${item.users / 10}%` }}
                  />
                  <div
                    className="w-5 rounded-t-md bg-amber-400"
                    style={{ height: `${item.requests / 10}%` }}
                  />
                </div>
                <p className="text-center text-xs text-slate-500">
                  {item.month}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-[#031b46]">
              Actividad reciente
            </h3>
            <Link
              href="/admin/activity"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Ver todas
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-100">
            {recentActivity.map((activity) => (
              <div
                key={`${activity.title}-${activity.time}`}
                className="flex gap-4 py-4"
              >
                <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700">
                    {activity.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activity.description}
                  </p>
                </div>

                <p className="hidden shrink-0 text-xs font-medium text-slate-500 md:block">
                  {activity.time}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <footer className="flex flex-col justify-between gap-3 pb-2 text-xs text-slate-500 md:flex-row">
        <p>© 2025 Universidad. Todos los derechos reservados.</p>

        <div className="flex gap-6">
          <Link href="/terms" className="hover:text-slate-700">
            Términos de uso
          </Link>
          <Link href="/privacy" className="hover:text-slate-700">
            Política de privacidad
          </Link>
        </div>
      </footer>
    </div>
  );
}

function formatCount(value: number) {
  return new Intl.NumberFormat("es-VE").format(value);
}
