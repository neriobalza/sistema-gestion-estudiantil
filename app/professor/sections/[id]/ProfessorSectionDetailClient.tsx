"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Mail, Phone, Save, Users } from "lucide-react";

type ProfessorSectionDetail = {
  id: string;
  code: string;
  status: string;
  modality: string;
  capacity: number;
  gradesLocked: boolean;
  gradesSubmittedAt: string | null;
  term: {
    code: string;
    status: string;
    startsAt: string;
    endsAt: string;
  };
  subject: {
    code: string;
    name: string;
    credits: number;
    department: string;
    faculty: string;
  };
  schedules: {
    id: string;
    dayOfWeek: string;
    startMinute: number;
    endMinute: number;
    classroomCode: string | null;
    classroomLocation: string;
  }[];
  gradeItems: {
    id: string;
    name: string;
    weight: number;
    maxScore: number;
    dueDate: string | null;
  }[];
  enrollments: Enrollment[];
};

type Enrollment = {
  id: string;
  status: string;
  finalGrade: number | null;
  gradeStatus: string | null;
  student: {
    name: string | null;
    email: string;
    institutionalId: string;
    studentCode: string;
    nationalId: string | null;
    phone: string | null;
    address: string | null;
    career: string;
    option: string;
    school: string;
  };
  grades: {
    id: string;
    itemName: string;
    score: number;
    maxScore: number;
    weight: number;
  }[];
};

type ApiResponse = {
  data?: ProfessorSectionDetail;
  message?: string;
};

type GradeApiResponse = {
  data?: {
    id: string;
    finalGrade: number | null;
    gradeStatus: string | null;
  };
  message?: string;
};

export function ProfessorSectionDetailClient({
  sectionId,
}: {
  sectionId: string;
}) {
  const [section, setSection] = useState<ProfessorSectionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingEnrollmentId, setSavingEnrollmentId] = useState<string | null>(
    null,
  );
  const [gradeValues, setGradeValues] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadSection() {
      try {
        const response = await fetch(`/api/professor/sections/${sectionId}`, {
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(payload.message ?? "No se pudo cargar la seccion");
        }

        if (!payload.data) {
          throw new Error("La respuesta no incluyo datos de la seccion");
        }

        if (!ignore) {
          setSection(payload.data);
          setGradeValues(
            Object.fromEntries(
              payload.data.enrollments.map((enrollment) => [
                enrollment.id,
                enrollment.finalGrade?.toString() ?? "",
              ]),
            ),
          );
          setError(null);
        }
      } catch (caughtError) {
        if (!ignore) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "No se pudo cargar la seccion",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadSection();

    return () => {
      ignore = true;
    };
  }, [sectionId]);

  async function saveGrade(event: FormEvent<HTMLFormElement>, enrollment: Enrollment) {
    event.preventDefault();
    setSavingEnrollmentId(enrollment.id);
    setNotice(null);
    setError(null);

    const rawValue = gradeValues[enrollment.id]?.trim() ?? "";
    const finalGrade = rawValue.length === 0 ? null : Number(rawValue);

    try {
      if (finalGrade !== null && !Number.isFinite(finalGrade)) {
        throw new Error("La nota debe ser un numero valido");
      }

      const response = await fetch(`/api/professor/sections/${sectionId}/grades`, {
        method: "PATCH",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enrollmentId: enrollment.id, finalGrade }),
      });
      const payload = (await response.json()) as GradeApiResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo actualizar la nota");
      }

      if (!payload.data) {
        throw new Error("La respuesta no incluyo la nota actualizada");
      }

      setSection((current) =>
        current
          ? {
              ...current,
              enrollments: current.enrollments.map((item) =>
                item.id === payload.data?.id
                  ? {
                      ...item,
                      finalGrade: payload.data.finalGrade,
                      gradeStatus: payload.data.gradeStatus,
                    }
                  : item,
              ),
            }
          : current,
      );
      setNotice("Nota actualizada correctamente");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo actualizar la nota",
      );
    } finally {
      setSavingEnrollmentId(null);
    }
  }

  if (loading) {
    return <PanelMessage message="Cargando detalle de la seccion..." />;
  }

  if (error && !section) {
    return (
      <PanelMessage
        tone="error"
        title="No se pudo cargar la seccion"
        message={error}
      />
    );
  }

  if (!section) {
    return <PanelMessage tone="error" message="Seccion no encontrada." />;
  }

  const gradesDisabled = section.gradesLocked || section.term.status === "CLOSED";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/professor/sections"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#031b46]"
        >
          <ArrowLeft className="h-4 w-4" />
          Secciones
        </Link>
      </div>

      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
              {section.subject.code} · Seccion {section.code}
            </p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              {section.subject.name}
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
              {section.term.code} · {section.subject.department} ·{" "}
              {section.subject.faculty}
            </p>
          </div>

          <span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300">
            {section.status}
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={Users}
          label="Estudiantes"
          value={`${section.enrollments.length}/${section.capacity}`}
        />
        <MetricCard
          icon={Clock}
          label="Horario"
          value={formatSchedules(section.schedules)}
        />
        <MetricCard
          icon={Save}
          label="Notas"
          value={gradesDisabled ? "Bloqueadas" : "Editables"}
        />
      </section>

      {section.term.status === "CLOSED" ? (
        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-800">
          El periodo academico esta cerrado. Las notas finales ya no se pueden
          modificar.
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-bold text-[#031b46]">Estudiantes</h3>
          <span className="text-sm font-semibold text-slate-500">
            {section.enrollments.length} inscritos
          </span>
        </div>

        {section.enrollments.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
            No hay estudiantes inscritos en esta seccion.
          </p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-280 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-bold">Estudiante</th>
                  <th className="px-4 py-3 font-bold">Contacto</th>
                  <th className="px-4 py-3 font-bold">Carrera</th>
                  <th className="px-4 py-3 font-bold">Nota final</th>
                  <th className="px-4 py-3 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {section.enrollments.map((enrollment) => (
                  <tr key={enrollment.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-4 py-4">
                      <p className="font-bold text-slate-800">
                        {enrollment.student.name ?? "Estudiante"}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        {enrollment.student.studentCode} ·{" "}
                        {enrollment.student.institutionalId}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-amber-500" />
                        {enrollment.student.email}
                      </p>
                      <p className="mt-2 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-amber-500" />
                        {enrollment.student.phone ?? "Sin telefono"}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      <p className="font-semibold text-slate-700">
                        {enrollment.student.career}
                      </p>
                      <p className="mt-1 text-xs">
                        {enrollment.student.option} · {enrollment.student.school}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(event) => saveGrade(event, enrollment)}
                      >
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.01"
                          disabled={gradesDisabled}
                          value={gradeValues[enrollment.id] ?? ""}
                          onChange={(event) =>
                            setGradeValues((current) => ({
                              ...current,
                              [enrollment.id]: event.target.value,
                            }))
                          }
                          className="h-10 w-24 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-amber-400 focus:ring-2 focus:ring-amber-100 disabled:bg-slate-100"
                          aria-label={`Nota final de ${
                            enrollment.student.name ?? enrollment.student.studentCode
                          }`}
                        />
                        <button
                          type="submit"
                          disabled={
                            gradesDisabled ||
                            savingEnrollmentId === enrollment.id
                          }
                          className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#031b46] text-white transition hover:bg-[#06265f] disabled:cursor-not-allowed disabled:bg-slate-300"
                          aria-label="Guardar nota"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        label={enrollment.gradeStatus ?? enrollment.status}
                        tone={
                          enrollment.gradeStatus === "PASSED"
                            ? "success"
                            : enrollment.gradeStatus === "FAILED"
                              ? "danger"
                              : "neutral"
                        }
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

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-1 break-words text-sm font-bold text-[#031b46]">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone: "success" | "danger" | "neutral";
}) {
  const className =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "danger"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

function PanelMessage({
  title,
  message,
  tone = "neutral",
}: {
  title?: string;
  message: string;
  tone?: "neutral" | "error";
}) {
  const className =
    tone === "error"
      ? "rounded-2xl border border-red-100 bg-red-50 p-8 text-red-700 shadow-sm"
      : "rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm";

  return (
    <div className={className}>
      {title ? <p className="text-sm font-bold">{title}</p> : null}
      <p className="mt-2 text-sm font-semibold">{message}</p>
    </div>
  );
}

function formatSchedules(schedules: ProfessorSectionDetail["schedules"]) {
  if (schedules.length === 0) return "Sin horario";

  return schedules
    .map(
      (schedule) =>
        `${dayLabels[schedule.dayOfWeek] ?? schedule.dayOfWeek} ${formatMinute(
          schedule.startMinute,
        )}-${formatMinute(schedule.endMinute)}`,
    )
    .join(" · ");
}

function formatMinute(value: number) {
  const hours = Math.floor(value / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (value % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

const dayLabels: Record<string, string> = {
  MONDAY: "Lun",
  TUESDAY: "Mar",
  WEDNESDAY: "Mie",
  THURSDAY: "Jue",
  FRIDAY: "Vie",
  SATURDAY: "Sab",
  SUNDAY: "Dom",
};
