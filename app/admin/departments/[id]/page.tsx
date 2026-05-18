import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, GraduationCap, Layers3, UserRound } from "lucide-react";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { prisma } from "@/src/lib/prisma";

type DepartmentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function DepartmentDetailPage({
  params,
}: DepartmentDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      faculty: true,
      subjects: {
        orderBy: { code: "asc" },
        include: {
          _count: {
            select: {
              curriculumSubjects: true,
              sections: true,
              prerequisites: true,
            },
          },
        },
      },
      professors: {
        orderBy: { employeeCode: "asc" },
        include: {
          user: true,
          _count: {
            select: {
              sections: true,
              gradesUploaded: true,
            },
          },
        },
      },
    },
  });

  if (!department) {
    notFound();
  }

  const activeSubjects = department.subjects.filter(
    (subject) => subject.isActive,
  ).length;

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/faculties/${department.facultyId}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#031b46]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a {department.faculty.name}
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
            <Layers3 className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
              {department.code}
            </p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              {department.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
              {department.description ?? "Sin descripcion registrada."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Materias"
          value={department.subjects.length}
          icon={BookOpen}
        />
        <SummaryCard
          label="Materias activas"
          value={activeSubjects}
          icon={GraduationCap}
        />
        <SummaryCard
          label="Profesores"
          value={department.professors.length}
          icon={UserRound}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#031b46]">Materias</h2>
        </div>

        {department.subjects.length === 0 ? (
          <EmptyState label="Este departamento no tiene materias registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Código</th>
                  <th className="px-6 py-4 font-bold">Materia</th>
                  <th className="px-6 py-4 font-bold">Créditos</th>
                  <th className="px-6 py-4 font-bold">Secciones</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {department.subjects.map((subject) => (
                  <tr key={subject.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <CodePill value={subject.code} />
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">
                        {subject.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {subject.description ?? "Sin descripción"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {subject.credits}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {subject._count.sections}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-bold",
                          subject.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600",
                        ].join(" ")}
                      >
                        {subject.isActive ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Layers3;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#031b46]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#031b46]">{value}</p>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center px-6 py-10 text-center text-sm font-medium text-slate-500">
      {label}
    </div>
  );
}

function CodePill({ value }: { value: string }) {
  return (
    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
      {value}
    </span>
  );
}
