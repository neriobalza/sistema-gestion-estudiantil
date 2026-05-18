import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  DoorOpen,
  GraduationCap,
  Layers3,
} from "lucide-react";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { prisma } from "@/src/lib/prisma";

type FacultyDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function FacultyDetailPage({
  params,
}: FacultyDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

  const faculty = await prisma.faculty.findUnique({
    where: { id },
    include: {
      schools: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              careers: true,
              enrollmentPeriods: true,
            },
          },
        },
      },
      departments: {
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: {
              subjects: true,
              professors: true,
            },
          },
        },
      },
      classrooms: {
        orderBy: { code: "asc" },
        include: {
          _count: {
            select: {
              schedules: true,
            },
          },
        },
      },
    },
  });

  if (!faculty) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/faculties"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#031b46]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a facultades
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
                {faculty.code}
              </p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                {faculty.name}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                {faculty.description ?? "Sin descripcion registrada."}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Escuelas"
          value={faculty.schools.length}
          icon={GraduationCap}
        />
        <SummaryCard
          label="Departamentos"
          value={faculty.departments.length}
          icon={Layers3}
        />
        <SummaryCard
          label="Salones"
          value={faculty.classrooms.length}
          icon={DoorOpen}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <DetailTable
          title="Escuelas"
          emptyLabel="Esta facultad no tiene escuelas registradas."
          columns={["Codigo", "Nombre", "Carreras", "Periodos"]}
          rows={faculty.schools.map((school) => ({
            href: `/admin/faculties/${faculty.id}/schools/${school.id}`,
            cells: [
              school.code,
              school.name,
              String(school._count.careers),
              String(school._count.enrollmentPeriods),
            ],
          }))}
        />

        <DetailTable
          title="Departamentos"
          emptyLabel="Esta facultad no tiene departamentos registrados."
          columns={["Codigo", "Nombre", "Materias", "Profesores"]}
          rows={faculty.departments.map((department) => ({
            href: `/admin/faculties/${faculty.id}/departments/${department.id}`,
            cells: [
              department.code,
              department.name,
              String(department._count.subjects),
              String(department._count.professors),
            ],
          }))}
        />
      </section>

      <DetailTable
        title="Salones"
        emptyLabel="Esta facultad no tiene salones registrados."
        columns={["Codigo", "Edificio", "Aula", "Capacidad", "Horarios"]}
        rows={faculty.classrooms.map((classroom) => ({
          cells: [
            classroom.code,
            classroom.building ?? "Sin edificio",
            classroom.room ?? "Sin aula",
            classroom.capacity ? String(classroom.capacity) : "Sin capacidad",
            String(classroom._count.schedules),
          ],
        }))}
      />
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
  icon: typeof Building2;
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

function DetailTable({
  title,
  emptyLabel,
  columns,
  rows,
}: {
  title: string;
  emptyLabel: string;
  columns: string[];
  rows: { href?: string; cells: string[] }[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-6">
        <h2 className="text-lg font-bold text-[#031b46]">{title}</h2>
      </div>

      {rows.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center px-6 py-10 text-center text-sm font-medium text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-6 py-4 font-bold">
                    {column}
                  </th>
                ))}
                {rows.some((row) => row.href) && (
                  <th className="px-6 py-4 text-right font-bold">Detalle</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((row) => (
                <tr
                  key={row.cells.join("-")}
                  className="transition hover:bg-slate-50"
                >
                  {row.cells.map((cell, index) => (
                    <td
                      key={`${cell}-${index}`}
                      className="px-6 py-4 text-sm text-slate-700"
                    >
                      {index === 0 ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                          {cell}
                        </span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                  {rows.some((candidate) => candidate.href) && (
                    <td className="px-6 py-4 text-right">
                      {row.href ? (
                        <Link
                          href={row.href}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                          aria-label={`Ver detalle de ${row.cells[1]}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      ) : null}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
