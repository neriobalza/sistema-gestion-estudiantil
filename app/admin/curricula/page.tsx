import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { CreateCurriculumForm } from "./CreateCurriculumForm";

export const dynamic = "force-dynamic";

export default async function AdminCurriculaPage() {
  await requireAdmin();

  const curricula = await prisma.curriculum.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      careerOption: {
        include: {
          career: {
            include: {
              school: true,
            },
          },
        },
      },
      effectiveFromTerm: true,
      _count: {
        select: {
          subjects: true,
          electiveGroups: true,
          students: true,
        },
      },
    },
  });
  const [careerOptions, terms] = await Promise.all([
    prisma.careerOption.findMany({
      orderBy: [{ career: { name: "asc" } }, { name: "asc" }],
      include: {
        career: {
          include: {
            school: true,
          },
        },
      },
    }),
    prisma.academicTerm.findMany({
      orderBy: [{ year: "desc" }, { period: "asc" }],
      select: {
        id: true,
        code: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
          Pensums
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Consulta los pensums registrados por carrera, opción, versión y estado.
        </p>
      </section>

      <CreateCurriculumForm careerOptions={careerOptions} terms={terms} />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Pensums" value={curricula.length} />
        <MetricCard
          label="Activos"
          value={curricula.filter((curriculum) => curriculum.status === "ACTIVE").length}
        />
        <MetricCard
          label="Archivados"
          value={curricula.filter((curriculum) => curriculum.status === "ARCHIVED").length}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {curricula.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Pensum</th>
                  <th className="px-6 py-4 font-bold">Carrera</th>
                  <th className="px-6 py-4 font-bold">Opción</th>
                  <th className="px-6 py-4 font-bold">Versión</th>
                  <th className="px-6 py-4 font-bold">Créditos</th>
                  <th className="px-6 py-4 font-bold">Materias</th>
                  <th className="px-6 py-4 font-bold">Estudiantes</th>
                  <th className="px-6 py-4 font-bold">Vigencia</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 text-right font-bold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {curricula.map((curriculum) => (
                  <tr key={curriculum.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {curriculum.name}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        {curriculum.code}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <p>{curriculum.careerOption.career.name}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {curriculum.careerOption.career.school.name}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {curriculum.careerOption.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {curriculum.version}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {curriculum.totalCredits ?? "Sin definir"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {curriculum._count.subjects}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {curriculum._count.students}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {curriculum.effectiveFromTerm?.code ?? "Sin vigencia"}
                    </td>
                    <td className="px-6 py-4">
                      <StatusPill status={curriculum.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/curricula/${curriculum.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                        aria-label={`Ver detalle de ${curriculum.name}`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
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
          <FileText className="h-6 w-6" />
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
        <FileText className="h-8 w-8" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-[#031b46]">
        No hay pensums registrados
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Cuando existan pensums, aparecerán en esta lista.
      </p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "DRAFT"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {status}
    </span>
  );
}
