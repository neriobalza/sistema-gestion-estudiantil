import { GraduationCap } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { CreateProfessorForm } from "./CreateProfessorForm";
import { ProfessorsTable } from "./ProfessorsTable";

export const dynamic = "force-dynamic";

export default async function AdminProfessorsPage() {
  await requireAdmin();

  const [professors, departments] = await Promise.all([
    prisma.professorProfile.findMany({
      orderBy: { employeeCode: "asc" },
      include: {
        user: true,
        department: {
          include: {
            faculty: true,
          },
        },
        _count: {
          select: {
            sections: true,
            gradesUploaded: true,
          },
        },
      },
    }),
    prisma.department.findMany({
      orderBy: [{ faculty: { name: "asc" } }, { name: "asc" }],
      include: {
        faculty: true,
      },
    }),
  ]);
  const departmentOptions = departments.map((department) => ({
    id: department.id,
    code: department.code,
    name: department.name,
    faculty: {
      name: department.faculty.name,
    },
  }));

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
          Profesores
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Administra los profesores por facultad y departamento. Estos docentes
          pueden asignarse luego a secciones ofertadas en un período académico.
        </p>
      </section>

      <CreateProfessorForm departments={departmentOptions} />

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Profesores" value={professors.length} />
        <MetricCard
          label="Con departamento"
          value={professors.filter((professor) => professor.departmentId).length}
        />
        <MetricCard
          label="Secciones asignadas"
          value={professors.reduce(
            (total, professor) => total + professor._count.sections,
            0,
          )}
        />
      </section>

      {professors.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500">
              <GraduationCap className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#031b46]">
              No hay profesores registrados
            </h2>
          </div>
        </section>
      ) : (
        <ProfessorsTable
          departments={departmentOptions}
          professors={professors.map((professor) => ({
            id: professor.id,
            employeeCode: professor.employeeCode,
            phone: professor.phone,
            academicTitle: professor.academicTitle,
            office: professor.office,
            departmentId: professor.departmentId,
            user: {
              name: professor.user.name,
              email: professor.user.email,
              institutionalId: professor.user.institutionalId,
              status: professor.user.status,
            },
            department: professor.department
              ? {
                  name: professor.department.name,
                  faculty: {
                    name: professor.department.faculty.name,
                  },
                }
              : null,
            sectionsCount: professor._count.sections,
          }))}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#031b46]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#031b46]">{value}</p>
        </div>
      </div>
    </article>
  );
}
