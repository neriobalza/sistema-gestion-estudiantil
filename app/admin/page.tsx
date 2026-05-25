// src/app/admin/page.tsx

import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Building2,
  CalendarDays,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";

const quickActions = [
  {
    title: "Facultades",
    description: "Facultades, escuelas, departamentos y salones",
    href: "/admin/faculties",
    icon: Building2,
  },
  {
    title: "Profesores",
    description: "Docentes, departamentos y actualización de acceso",
    href: "/admin/professors",
    icon: GraduationCap,
  },
  {
    title: "Materias",
    description: "Catálogo de materias por departamento",
    href: "/admin/subjects",
    icon: BookOpen,
  },
  {
    title: "Pensums",
    description: "Carreras, opciones y materias del pensum",
    href: "/admin/curricula",
    icon: FileText,
  },
  {
    title: "Períodos y oferta",
    description: "Períodos, inscripción, secciones y horarios",
    href: "/admin/academic-terms",
    icon: CalendarDays,
  },
];

export default async function AdminDashboardPage() {
  const [
    studentsCount,
    professorsCount,
    facultiesCount,
    subjectsCount,
    academicTermsCount,
    sectionsCount,
  ] = await Promise.all([
    prisma.studentProfile.count(),
    prisma.professorProfile.count(),
    prisma.faculty.count(),
    prisma.subject.count(),
    prisma.academicTerm.count(),
    prisma.courseSection.count(),
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
      label: "Materias",
      value: formatCount(subjectsCount),
      helper: "Catálogo académico",
      icon: BookOpen,
    },
    {
      label: "Períodos",
      value: formatCount(academicTermsCount),
      helper: "Registrados en el sistema",
      icon: CalendarDays,
    },
    {
      label: "Secciones",
      value: formatCount(sectionsCount),
      helper: "Oferta académica creada",
      icon: FileText,
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
              Desde aquí puedes acceder a la estructura académica, profesores,
              pensums, materias y períodos con oferta de secciones.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#031b46]">Gestión rápida</h3>
        <p className="mt-1 text-sm text-slate-500">
          Accesos directos a los módulos administrativos disponibles.
        </p>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
