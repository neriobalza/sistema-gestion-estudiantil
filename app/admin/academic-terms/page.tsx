import { CalendarDays } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { CreateAcademicTermForm } from "./CreateAcademicTermForm";

export const dynamic = "force-dynamic";

export default async function AdminAcademicTermsPage() {
  await requireAdmin();

  const terms = await prisma.academicTerm.findMany({
    orderBy: [{ year: "desc" }, { period: "asc" }],
    include: {
      _count: {
        select: {
          enrollmentPeriods: true,
          sections: true,
          admittedStudents: true,
          curriculaEffective: true,
        },
      },
    },
  });
  const faculties = await prisma.faculty.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
          Períodos académicos
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Consulta los períodos académicos, ventanas de inscripción, secciones y
          pensums con vigencia asociada.
        </p>
      </section>

      <CreateAcademicTermForm faculties={faculties} />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Períodos" value={terms.length} />
        <MetricCard
          label="Activos"
          value={terms.filter((term) => term.status === "ACTIVE").length}
        />
        <MetricCard
          label="Planificados"
          value={terms.filter((term) => term.status === "PLANNED").length}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {terms.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Código</th>
                  <th className="px-6 py-4 font-bold">Año</th>
                  <th className="px-6 py-4 font-bold">Período</th>
                  <th className="px-6 py-4 font-bold">Inicio</th>
                  <th className="px-6 py-4 font-bold">Fin</th>
                  <th className="px-6 py-4 font-bold">Inscripciones</th>
                  <th className="px-6 py-4 font-bold">Secciones</th>
                  <th className="px-6 py-4 font-bold">Admitidos</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {terms.map((term) => (
                  <tr key={term.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        {term.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {term.year}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {term.period}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(term.startsAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDate(term.endsAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {term._count.enrollmentPeriods}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {term._count.sections}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {term._count.admittedStudents}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={term.status} />
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

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#031b46]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#031b46]">{value}</p>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500">
        <CalendarDays className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#031b46]">
        No hay períodos registrados
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Cuando existan períodos académicos, aparecerán en esta lista.
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "PLANNED"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {status}
    </span>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
