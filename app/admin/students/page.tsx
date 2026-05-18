import { GraduationCap } from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  await requireAdmin();

  const students = await prisma.studentProfile.findMany({
    orderBy: { studentCode: "asc" },
    include: {
      user: true,
      currentCareerOption: {
        include: {
          career: true,
        },
      },
      curriculum: true,
    },
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
          Estudiantes
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Administra los estudiantes admitidos de la universidad.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {students.length === 0 ? (
          <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500">
              <GraduationCap className="h-8 w-8" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-[#031b46]">
              No hay estudiantes registrados
            </h2>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Estudiante</th>
                  <th className="px-6 py-4 font-bold">Codigo</th>
                  <th className="px-6 py-4 font-bold">Carrera</th>
                  <th className="px-6 py-4 font-bold">Pensum</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/70">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {student.user.name ?? "Sin nombre"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {student.user.email}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {student.studentCode}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.currentCareerOption.career.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.curriculum.name}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        {student.status}
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
