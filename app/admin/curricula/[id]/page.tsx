import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileText,
  GraduationCap,
  Layers3,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";

type CurriculumDetailPageProps = {
  params: Promise<{ id: string }>;
};

type CurriculumSubjectRow = {
  id: string;
  requirementType: string;
  semesterNumber: number;
  credits: number;
  minPassingGrade: unknown;
  electiveGroup: {
    name: string;
  } | null;
  subject: {
    code: string;
    name: string;
    description: string | null;
    credits: number;
    hoursPerWeek: number | null;
    department: {
      name: string;
    };
  };
};

export const dynamic = "force-dynamic";

export default async function CurriculumDetailPage({
  params,
}: CurriculumDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  const curriculum = await prisma.curriculum.findUnique({
    where: { id },
    include: {
      careerOption: {
        include: {
          career: {
            include: {
              school: {
                include: {
                  faculty: true,
                },
              },
            },
          },
        },
      },
      effectiveFromTerm: true,
      subjects: {
        orderBy: [{ semesterNumber: "asc" }, { subject: { code: "asc" } }],
        include: {
          electiveGroup: true,
          subject: {
            include: {
              department: true,
            },
          },
        },
      },
      electiveGroups: {
        orderBy: [{ semesterNumber: "asc" }, { name: "asc" }],
      },
      _count: {
        select: {
          students: true,
        },
      },
    },
  });

  if (!curriculum) {
    notFound();
  }

  const requiredSubjects = curriculum.subjects.filter(
    (item) => item.requirementType === "REQUIRED",
  );
  const electiveSubjects = curriculum.subjects.filter(
    (item) => item.requirementType === "ELECTIVE",
  );
  const requiredCreditsFromSubjects = requiredSubjects.reduce(
    (total, item) => total + item.credits,
    0,
  );
  const electiveRequiredCredits = curriculum.electiveGroups.reduce(
    (total, group) => total + (group.requiredCredits ?? 0),
    0,
  );
  const allListedCredits = curriculum.subjects.reduce(
    (total, item) => total + item.credits,
    0,
  );
  const calculatedRequiredCredits =
    requiredCreditsFromSubjects + electiveRequiredCredits || allListedCredits;
  const creditsToGraduate =
    curriculum.totalCredits ?? calculatedRequiredCredits;
  const creditSource = curriculum.totalCredits
    ? "Definido en el pensum"
    : "Calculado desde materias y electivas";
  const semesters = Array.from(
    new Set(curriculum.subjects.map((item) => item.semesterNumber)),
  ).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/curricula"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#031b46]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a pensums
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
              <FileText className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
                {curriculum.code} · Versión {curriculum.version}
              </p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                {curriculum.name}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
                {curriculum.careerOption.career.name} ·{" "}
                {curriculum.careerOption.name} ·{" "}
                {curriculum.careerOption.career.school.name} ·{" "}
                {curriculum.careerOption.career.school.faculty.name}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
            <p className="text-sm font-semibold text-slate-200">
              Unidades de crédito requeridas
            </p>
            <p className="mt-1 text-4xl font-bold text-white">
              {creditsToGraduate}
            </p>
            <p className="mt-1 text-xs font-medium text-amber-200">
              {creditSource}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Materias"
          value={curriculum.subjects.length}
          icon={BookOpen}
        />
        <MetricCard
          label="Obligatorias"
          value={requiredSubjects.length}
          icon={CheckCircle2}
        />
        <MetricCard
          label="Electivas"
          value={electiveSubjects.length}
          icon={Layers3}
        />
        <MetricCard
          label="Estudiantes"
          value={curriculum._count.students}
          icon={GraduationCap}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard label="Estado" value={curriculum.status} />
        <InfoCard
          label="Vigente desde"
          value={curriculum.effectiveFromTerm?.code ?? "Sin vigencia"}
        />
        <InfoCard
          label="Créditos obligatorios"
          value={String(requiredCreditsFromSubjects)}
        />
      </section>

      {curriculum.electiveGroups.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <h2 className="text-lg font-bold text-[#031b46]">
              Grupos electivos
            </h2>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {curriculum.electiveGroups.map((group) => (
              <article
                key={group.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <p className="text-sm font-bold text-[#031b46]">
                  {group.name}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Semestre {group.semesterNumber}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {group.requiredCredits
                    ? `${group.requiredCredits} créditos requeridos`
                    : "Créditos requeridos sin definir"}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {group.requiredSubjects
                    ? `${group.requiredSubjects} materias requeridas`
                    : "Cantidad de materias sin definir"}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#031b46]">
            Materias del pensum
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Desglose por semestre con unidades de crédito, tipo de requisito y
            nota mínima aprobatoria.
          </p>
        </div>

        {curriculum.subjects.length === 0 ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-[#031b46]">
              Este pensum no tiene materias registradas
            </h3>
          </section>
        ) : (
          semesters.map((semester) => (
            <SemesterTable
              key={semester}
              semester={semester}
              subjects={curriculum.subjects.filter(
                (item) => item.semesterNumber === semester,
              )}
            />
          ))
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof FileText;
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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-[#031b46]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">{value}</p>
    </article>
  );
}

function SemesterTable({
  semester,
  subjects,
}: {
  semester: number;
  subjects: CurriculumSubjectRow[];
}) {
  const semesterCredits = subjects.reduce((total, item) => total + item.credits, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#031b46]">
            Semestre {semester}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {subjects.length} materias · {semesterCredits} créditos listados
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-240 text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">Materia</th>
              <th className="px-6 py-4 font-bold">Departamento</th>
              <th className="px-6 py-4 font-bold">Tipo</th>
              <th className="px-6 py-4 font-bold">Grupo electivo</th>
              <th className="px-6 py-4 font-bold">Créditos</th>
              <th className="px-6 py-4 font-bold">Horas</th>
              <th className="px-6 py-4 font-bold">Nota mínima</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((item) => (
              <tr key={item.id} className="transition hover:bg-slate-50">
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">
                    {item.subject.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    {item.subject.code}
                  </p>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {item.subject.department.name}
                </td>
                <td className="px-6 py-4">
                  <RequirementPill requirementType={item.requirementType} />
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {item.electiveGroup?.name ?? "No aplica"}
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                  {item.credits}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {item.subject.hoursPerWeek ?? "Sin definir"}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {String(item.minPassingGrade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RequirementPill({ requirementType }: { requirementType: string }) {
  const isRequired = requirementType === "REQUIRED";

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-bold",
        isRequired
          ? "bg-emerald-50 text-emerald-700"
          : "bg-blue-50 text-blue-700",
      ].join(" ")}
    >
      {isRequired ? "Obligatoria" : "Electiva"}
    </span>
  );
}
