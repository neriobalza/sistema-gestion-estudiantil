import { BookOpen } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { CreateSubjectForm } from "./CreateSubjectForm";

export const dynamic = "force-dynamic";

export default async function AdminSubjectsPage() {
  await requireAdmin();

  const subjects = await prisma.subject.findMany({
    orderBy: { code: "asc" },
    include: {
      department: {
        include: {
          faculty: true,
        },
      },
      _count: {
        select: {
          curriculumSubjects: true,
          sections: true,
          prerequisites: true,
        },
      },
    },
  });
  const departments = await prisma.department.findMany({
    orderBy: [{ faculty: { name: "asc" } }, { name: "asc" }],
    include: {
      faculty: true,
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materias"
        description="Consulta las materias base registradas, su departamento responsable y su presencia en pensums y secciones."
      />

      <CreateSubjectForm departments={departments} />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Materias" value={subjects.length} icon={BookOpen} />
        <MetricCard
          label="Activas"
          value={subjects.filter((subject) => subject.isActive).length}
          icon={BookOpen}
        />
        <MetricCard
          label="Inactivas"
          value={subjects.filter((subject) => !subject.isActive).length}
          icon={BookOpen}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {subjects.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No hay materias registradas"
            description="Cuando existan materias, aparecerán en esta lista."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Materia</th>
                  <th className="px-6 py-4 font-bold">Departamento</th>
                  <th className="px-6 py-4 font-bold">Créditos</th>
                  <th className="px-6 py-4 font-bold">Horas</th>
                  <th className="px-6 py-4 font-bold">Pensums</th>
                  <th className="px-6 py-4 font-bold">Secciones</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((subject) => (
                  <tr key={subject.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {subject.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        {subject.code}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <p>{subject.department.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {subject.department.faculty.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {subject.credits}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {subject.hoursPerWeek ?? "Sin definir"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {subject._count.curriculumSubjects}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {subject._count.sections}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill
                        label={subject.isActive ? "Activa" : "Inactiva"}
                        tone={subject.isActive ? "success" : "neutral"}
                      />
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

function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section>
      <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
        {title}
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-500">{description}</p>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof BookOpen;
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#031b46]">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "neutral";
}) {
  const className =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}
