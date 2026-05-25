import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, FileText, GraduationCap } from "lucide-react";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { prisma } from "@/src/lib/prisma";
import { SchoolCareerForms } from "./SchoolCareerForms";

type SchoolDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function SchoolDetailPage({
  params,
}: SchoolDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  const school = await prisma.school.findUnique({
    where: { id },
    include: {
      faculty: true,
      careers: {
        orderBy: { name: "asc" },
        include: {
          options: {
            orderBy: { name: "asc" },
            include: {
              _count: {
                select: {
                  curricula: true,
                  students: true,
                },
              },
            },
          },
          _count: {
            select: {
              options: true,
              enrollmentPeriods: true,
            },
          },
        },
      },
      enrollmentPeriods: {
        orderBy: { startsAt: "desc" },
        include: {
          term: true,
        },
      },
    },
  });

  if (!school) {
    notFound();
  }

  const careerOptionsCount = school.careers.reduce(
    (total, career) => total + career._count.options,
    0,
  );
  const curriculaCount = school.careers.reduce(
    (total, career) =>
      total +
      career.options.reduce(
        (optionTotal, option) => optionTotal + option._count.curricula,
        0,
      ),
    0,
  );

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/faculties/${school.facultyId}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#031b46]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a {school.faculty.name}
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
              {school.code}
            </p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              {school.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
              {school.description ?? "Sin descripcion registrada."}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard label="Carreras" value={school.careers.length} icon={BookOpen} />
        <SummaryCard
          label="Opciones"
          value={careerOptionsCount}
          icon={GraduationCap}
        />
        <SummaryCard label="Pensums" value={curriculaCount} icon={FileText} />
      </section>

      <SchoolCareerForms
        schoolId={school.id}
        careers={school.careers.map((career) => ({
          id: career.id,
          code: career.code,
          name: career.name,
        }))}
      />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#031b46]">Carreras</h2>
        </div>

        {school.careers.length === 0 ? (
          <EmptyState label="Esta escuela no tiene carreras registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Código</th>
                  <th className="px-6 py-4 font-bold">Nombre</th>
                  <th className="px-6 py-4 font-bold">Opciones</th>
                  <th className="px-6 py-4 font-bold">Períodos</th>
                  <th className="px-6 py-4 font-bold">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {school.careers.map((career) => (
                  <tr key={career.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <CodePill value={career.code} />
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {career.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {career._count.options}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {career._count.enrollmentPeriods}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {career.description ?? "Sin descripción"}
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
  icon: typeof GraduationCap;
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
