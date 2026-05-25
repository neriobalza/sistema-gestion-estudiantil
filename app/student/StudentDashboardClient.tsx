"use client";

import type { ComponentType, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock,
  GraduationCap,
  Mail,
  Trash2,
  TrendingUp,
} from "lucide-react";

type StudentDashboardView =
  | "dashboard"
  | "grades"
  | "schedule"
  | "enrollment"
  | "curriculum";

type StudentDashboardData = {
  student: {
    name: string | null;
    email: string;
    institutionalId: string;
    studentCode: string;
    nationalId: string | null;
    birthDate: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    admissionTerm: {
      code: string;
      startsAt: string;
    } | null;
    career: {
      faculty: string;
      school: string;
      name: string;
      option: string;
    };
    curriculum: {
      code: string;
      name: string;
      version: number;
      totalCredits: number;
    };
  };
  summary: {
    average: number | null;
    enrollmentGroup: number | null;
    approvedCredits: number;
    totalCredits: number;
    approvedSubjects: number;
    totalSubjects: number;
    activeEnrollments: number;
  };
  enrollments: Enrollment[];
  curriculumSubjects: {
    id: string;
    semesterNumber: number;
    requirementType: string;
    credits: number;
    minPassingGrade: number;
    approved: boolean;
    prerequisiteSubjectIds: string[];
    subject: {
      id: string;
      code: string;
      name: string;
    };
  }[];
};

type CurriculumSubject = StudentDashboardData["curriculumSubjects"][number];

type Enrollment = {
  id: string;
  status: string;
  finalGrade: number | null;
  gradeStatus: string | null;
  termCode: string;
  termStatus: string;
  termStartsAt: string;
  termEndsAt: string;
  enrollmentPeriodName: string | null;
  subject: {
    code: string;
    name: string;
    credits: number;
  };
  section: {
    code: string;
    modality: string;
    professorName: string | null;
  };
  grades: {
    id: string;
    itemName: string;
    score: number;
    maxScore: number;
    weight: number;
    gradedAt: string;
  }[];
  schedules: {
    id: string;
    dayOfWeek: string;
    startMinute: number;
    endMinute: number;
    classroomCode: string | null;
    classroomLocation: string;
  }[];
};

type ApiResponse = {
  data?: StudentDashboardData;
  message?: string;
};

type EnrollmentOffering = {
  id: string;
  sectionCode: string;
  capacity: number;
  enrolledCount: number;
  availableSeats: number;
  modality: string;
  hasScheduleConflict: boolean;
  professorName: string | null;
  subject: {
    id: string;
    code: string;
    name: string;
    credits: number;
  };
  schedules: {
    id: string;
    dayOfWeek: string;
    startMinute: number;
    endMinute: number;
    classroomCode: string | null;
    classroomLocation: string;
  }[];
};

type StudentEnrollmentData = {
  enrollmentPeriod: {
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    term: {
      id: string;
      code: string;
    };
  } | null;
  offerings: EnrollmentOffering[];
  activeEnrollments: {
    id: string;
    subject: {
      code: string;
      name: string;
    };
    section: {
      code: string;
    };
    schedules: {
      id: string;
      dayOfWeek: string;
      startMinute: number;
      endMinute: number;
    }[];
  }[];
};

type StudentEnrollmentApiResponse = {
  data?: StudentEnrollmentData;
  message?: string;
};

const activeEnrollmentStatuses = new Set(["PENDING", "ENROLLED"]);

export function StudentDashboardClient({
  view = "dashboard",
}: {
  view?: StudentDashboardView;
}) {
  const [data, setData] = useState<StudentDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await fetch("/api/student/dashboard", {
        headers: {
          Accept: "application/json",
        },
      });
      const payload = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo cargar la información");
      }

      if (!payload.data) {
        throw new Error("La respuesta no incluyó datos del estudiante");
      }

      setData(payload.data);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cargar la información",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-slate-600">
          Cargando información académica...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-red-700 shadow-sm">
        <p className="text-sm font-bold">No se pudo cargar el dashboard</p>
        <p className="mt-2 text-sm">{error ?? "Intenta nuevamente."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StudentHero data={data} />

      {view === "dashboard" && <DashboardOverview data={data} />}
      {view === "grades" && <GradesView enrollments={data.enrollments} />}
      {view === "schedule" && <ScheduleView enrollments={data.enrollments} />}
      {view === "enrollment" && (
        <EnrollmentView data={data} onEnrollmentChanged={loadDashboard} />
      )}
      {view === "curriculum" && <CurriculumView data={data} />}
    </div>
  );
}

function StudentHero({ data }: { data: StudentDashboardData }) {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
      <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
            <GraduationCap className="h-8 w-8" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
              {data.student.studentCode}
            </p>
            <h2 className="mt-1 text-2xl font-bold md:text-3xl">
              {data.student.name ?? "Estudiante"}
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
              {data.student.career.name} · {data.student.career.option} ·{" "}
              {data.student.career.school} · {data.student.career.faculty}
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
          {data.student.status}
        </span>
      </div>
    </section>
  );
}

function DashboardOverview({ data }: { data: StudentDashboardData }) {
  const progress = getProgress(data.summary.approvedCredits, data.summary.totalCredits);
  const activeTermEnrollments = data.enrollments.filter(
    isEnrollmentInActiveAcademicTerm,
  );

  return (
    <>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={TrendingUp}
          label="Promedio"
          value={formatNullableNumber(data.summary.average)}
          detail={
            data.summary.enrollmentGroup
              ? `Grupo ${data.summary.enrollmentGroup} de inscripción`
              : "Sin notas definitivas"
          }
        />
        <InfoCard
          icon={BookOpen}
          label="Avance"
          value={`${progress}%`}
          detail={`${data.summary.approvedCredits}/${data.summary.totalCredits} créditos aprobados`}
        />
        <InfoCard
          icon={CalendarDays}
          label="Inscritas activas"
          value={String(data.summary.activeEnrollments)}
          detail="Materias pendientes o inscritas"
        />
        <InfoCard
          icon={Mail}
          label="Correo"
          value={data.student.email}
          detail={data.student.institutionalId}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h3 className="text-lg font-bold text-[#031b46]">Datos personales</h3>
          <dl className="mt-5 grid gap-4 md:grid-cols-2">
            <DetailItem label="C.I. nacional">
              {data.student.nationalId ?? "Sin C.I. registrada"}
            </DetailItem>
            <DetailItem label="Teléfono">
              {data.student.phone ?? "Sin teléfono"}
            </DetailItem>
            <DetailItem label="Fecha de nacimiento">
              {data.student.birthDate
                ? formatDate(data.student.birthDate)
                : "Sin fecha registrada"}
            </DetailItem>
            <DetailItem label="Dirección">
              {data.student.address ?? "Sin dirección"}
            </DetailItem>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-[#031b46]">Académico</h3>
          <dl className="mt-5 space-y-4">
            <DetailItem label="Período de ingreso">
              {data.student.admissionTerm?.code ?? "Sin período"}
            </DetailItem>
            <DetailItem label="Pensum">
              {data.student.curriculum.name}
            </DetailItem>
            <DetailItem label="Código de pensum">
              {data.student.curriculum.code}
            </DetailItem>
            <DetailItem label="Materias aprobadas">
              {data.summary.approvedSubjects}/{data.summary.totalSubjects}
            </DetailItem>
          </dl>
        </article>
      </section>

      <EnrollmentTable
        enrollments={activeTermEnrollments.slice(0, 6)}
        title="Materias recientes"
        emptyMessage="No hay materias recientes en un período académico activo."
      />
    </>
  );
}

function GradesView({ enrollments }: { enrollments: Enrollment[] }) {
  return <EnrollmentTable enrollments={enrollments} title="Notas e historial" />;
}

function ScheduleView({ enrollments }: { enrollments: Enrollment[] }) {
  const blocks = useMemo(
    () =>
      enrollments
        .filter(isEnrollmentInActiveAcademicTerm)
        .flatMap((enrollment) =>
          enrollment.schedules
            .filter((schedule) => weekdayValues.has(schedule.dayOfWeek))
            .map((schedule) => ({
              ...schedule,
              enrollmentId: enrollment.id,
              subjectCode: enrollment.subject.code,
              subjectName: enrollment.subject.name,
              sectionCode: enrollment.section.code,
              professorName: enrollment.section.professorName ?? "Sin profesor",
            })),
        )
        .sort(
          (left, right) =>
            dayColumnIndex(left.dayOfWeek) - dayColumnIndex(right.dayOfWeek) ||
            left.startMinute - right.startMinute,
        ),
    [enrollments],
  );

  if (blocks.length === 0) {
    return <EmptyState icon={Clock} message="No hay horario activo para mostrar." />;
  }

  const scheduleBounds = getScheduleGridBounds(blocks);
  const timeSlots = buildTimeSlots(
    scheduleBounds.startMinute,
    scheduleBounds.endMinute,
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#031b46]">Horario activo</h3>
      <div className="mt-5 overflow-x-auto">
        <div
          className="grid min-w-260 rounded-xl border border-slate-200 bg-white"
          style={{
            gridTemplateColumns: "5rem repeat(5, minmax(10rem, 1fr))",
            gridTemplateRows: `3rem repeat(${timeSlots.length}, 2.75rem)`,
          }}
        >
          <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50" />
          {weekDays.map((day) => (
            <div
              key={day.value}
              className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 last:border-r-0"
            >
              {day.label}
            </div>
          ))}

          {timeSlots.map((slot, index) => (
            <div
              key={slot}
              className="sticky left-0 z-10 border-r border-slate-200 bg-slate-50 px-2 py-2 text-xs font-bold text-slate-500"
              style={{ gridColumn: 1, gridRow: index + 2 }}
            >
              {formatMinutes(slot)}
            </div>
          ))}

          {timeSlots.map((slot, slotIndex) =>
            weekDays.map((day, dayIndex) => (
              <div
                key={`${day.value}-${slot}`}
                className="border-b border-r border-slate-100 last:border-r-0"
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: slotIndex + 2,
                }}
              />
            )),
          )}

          {blocks.map((block) => {
            const rowStart =
              Math.floor((block.startMinute - scheduleBounds.startMinute) / 30) + 2;
            const rowSpan = Math.max(
              1,
              Math.ceil((block.endMinute - block.startMinute) / 30),
            );

            return (
              <article
                key={`${block.enrollmentId}-${block.id}`}
                className="z-10 m-1 overflow-hidden rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm"
                style={{
                  gridColumn: dayColumnIndex(block.dayOfWeek) + 2,
                  gridRow: `${rowStart} / span ${rowSpan}`,
                }}
              >
                <p className="truncate text-xs font-bold text-[#031b46]">
                  {block.subjectCode} · {block.subjectName}
                </p>
                <p className="mt-1 text-xs font-semibold text-amber-700">
                  {formatMinutes(block.startMinute)} - {formatMinutes(block.endMinute)}
                </p>
                <p className="mt-1 truncate text-xs text-slate-600">
                  Sec. {block.sectionCode} · {block.classroomCode ?? "Sin aula"}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {block.professorName}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function EnrollmentView({
  data,
  onEnrollmentChanged,
}: {
  data: StudentDashboardData;
  onEnrollmentChanged: () => Promise<void>;
}) {
  const activeEnrollments = data.enrollments.filter((enrollment) =>
    isEnrollmentInActiveAcademicTerm(enrollment),
  );
  const [enrollmentData, setEnrollmentData] =
    useState<StudentEnrollmentData | null>(null);
  const [loadingOfferings, setLoadingOfferings] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submittingSectionId, setSubmittingSectionId] = useState<string | null>(
    null,
  );
  const [cancelingEnrollmentId, setCancelingEnrollmentId] = useState<string | null>(
    null,
  );

  const loadOfferings = useCallback(async () => {
    try {
      const response = await fetch("/api/student/enrollment", {
        headers: {
          Accept: "application/json",
        },
      });
      const payload = (await response.json()) as StudentEnrollmentApiResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo cargar la oferta");
      }

      if (!payload.data) {
        throw new Error("La respuesta no incluyó datos de inscripción");
      }

      setEnrollmentData(payload.data);
      setError(null);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cargar la oferta",
      );
    } finally {
      setLoadingOfferings(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadOfferings();
  }, [loadOfferings]);

  async function enrollSection(sectionId: string) {
    setSubmittingSectionId(sectionId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/student/enrollment", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sectionId }),
      });
      const payload = (await response.json()) as StudentEnrollmentApiResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo inscribir la materia");
      }

      setSuccessMessage(payload.message ?? "Materia inscrita correctamente");
      await Promise.all([
        loadOfferings(),
        onEnrollmentChanged(),
      ]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo inscribir la materia",
      );
    } finally {
      setSubmittingSectionId(null);
    }
  }

  async function cancelEnrollment(enrollmentId: string) {
    setCancelingEnrollmentId(enrollmentId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/student/enrollment", {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ enrollmentId }),
      });
      const payload = (await response.json()) as StudentEnrollmentApiResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "No se pudo cancelar la inscripcion");
      }

      setSuccessMessage(payload.message ?? "Inscripcion cancelada correctamente");
      await Promise.all([loadOfferings(), onEnrollmentChanged()]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cancelar la inscripcion",
      );
    } finally {
      setCancelingEnrollmentId(null);
    }
  }

  const groupedOfferings = useMemo(
    () => groupOfferingsBySubject(enrollmentData?.offerings ?? []),
    [enrollmentData?.offerings],
  );

  return (
    <div className="space-y-4">
      <section className="grid gap-4 lg:grid-cols-3">
        <InfoCard
          icon={TrendingUp}
          label="Grupo"
          value={
            data.summary.enrollmentGroup
              ? `Grupo ${data.summary.enrollmentGroup}`
              : "Sin grupo"
          }
          detail={`Promedio ${formatNullableNumber(data.summary.average)}`}
        />
        <InfoCard
          icon={CalendarDays}
          label="Periodo de inscripción"
          value={enrollmentData?.enrollmentPeriod?.name ?? "Sin periodo activo"}
          detail={
            enrollmentData?.enrollmentPeriod
              ? `Periodo ${enrollmentData.enrollmentPeriod.term.code}`
              : `${activeEnrollments.length} materias activas`
          }
        />
        <InfoCard
          icon={BookOpen}
          label="Créditos aprobados"
          value={`${data.summary.approvedCredits}/${data.summary.totalCredits}`}
          detail="Usados para avance académico"
        />
      </section>

      {error && (
        <InlineNotice icon={AlertCircle} tone="error" message={error} />
      )}
      {successMessage && (
        <InlineNotice
          icon={CheckCircle2}
          tone="success"
          message={successMessage}
        />
      )}

      <EnrollmentTable
        enrollments={activeEnrollments}
        title="Materias inscritas"
        onCancel={cancelEnrollment}
        cancelingEnrollmentId={cancelingEnrollmentId}
        canCancel={Boolean(enrollmentData?.enrollmentPeriod)}
      />

      {loadingOfferings ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold text-slate-600">
            Cargando oferta disponible...
          </p>
        </section>
      ) : !enrollmentData?.enrollmentPeriod ? (
        <EmptyState
          icon={CalendarDays}
          message="No hay un proceso de inscripción activo para tu periodo académico."
        />
      ) : groupedOfferings.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          message="No hay materias ofertadas que puedas inscribir en este momento."
        />
      ) : (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#031b46]">
                Oferta disponible
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {enrollmentData.enrollmentPeriod.name} ·{" "}
                {enrollmentData.enrollmentPeriod.term.code}
              </p>
            </div>
            <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              {enrollmentData.offerings.length} secciones
            </span>
          </div>

          <div className="mt-5 space-y-5">
            {groupedOfferings.map((group) => (
              <article
                key={group.subject.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
                      {group.subject.code} · {group.subject.credits} UC
                    </p>
                    <h4 className="mt-1 text-base font-bold text-[#031b46]">
                      {group.subject.name}
                    </h4>
                  </div>
                  <span className="w-fit rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    Prelaciones aprobadas
                  </span>
                </div>

                <div className="mt-4 grid gap-3 xl:grid-cols-2">
                  {group.sections.map((section) => {
                    const isFull = section.availableSeats <= 0;
                    const disabled =
                      isFull ||
                      section.hasScheduleConflict ||
                      submittingSectionId !== null;

                    return (
                      <div
                        key={section.id}
                        className="rounded-lg border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Sección {section.sectionCode}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {section.professorName ?? "Sin profesor"} ·{" "}
                              {formatModality(section.modality)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">
                            {section.availableSeats}/{section.capacity} cupos
                          </span>
                        </div>

                        <div className="mt-3 space-y-1">
                          {section.schedules.length > 0 ? (
                            section.schedules.map((schedule) => (
                              <p
                                key={schedule.id}
                                className="text-xs font-semibold text-slate-600"
                              >
                                {getDayLabel(schedule.dayOfWeek)} ·{" "}
                                {formatMinutes(schedule.startMinute)} -{" "}
                                {formatMinutes(schedule.endMinute)} ·{" "}
                                {schedule.classroomCode ?? "Sin aula"}
                              </p>
                            ))
                          ) : (
                            <p className="text-xs font-semibold text-slate-500">
                              Sin horario publicado
                            </p>
                          )}
                        </div>

                        {section.hasScheduleConflict && (
                          <p className="mt-3 text-xs font-bold text-red-600">
                            Colisiona con tu horario actual
                          </p>
                        )}
                        {isFull && (
                          <p className="mt-3 text-xs font-bold text-red-600">
                            Sin cupos disponibles
                          </p>
                        )}

                        <button
                          type="button"
                          onClick={() => void enrollSection(section.id)}
                          disabled={disabled}
                          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05245d] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {submittingSectionId === section.id
                            ? "Inscribiendo..."
                            : "Inscribir"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CurriculumView({ data }: { data: StudentDashboardData }) {
  const graph = buildCurriculumGraph(data.curriculumSubjects);
  const [hoveredSubjectId, setHoveredSubjectId] = useState<string | null>(null);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#031b46]">Plan de estudio</h3>
          <p className="mt-1 text-sm text-slate-500">
            {data.student.curriculum.name} · versión {data.student.curriculum.version}
          </p>
        </div>
        <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
          {data.summary.approvedSubjects}/{data.summary.totalSubjects} materias
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        <div
          className="relative rounded-xl border border-slate-200 bg-slate-50"
          style={{
            width: graph.width,
            height: graph.height,
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={graph.width}
            height={graph.height}
            viewBox={`0 0 ${graph.width} ${graph.height}`}
            aria-hidden="true"
          >
            <defs>
              <marker
                id="curriculum-arrow"
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="7"
                refY="4"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#94a3b8" />
              </marker>
              <marker
                id="curriculum-arrow-prerequisite"
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="7"
                refY="4"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#2563eb" />
              </marker>
              <marker
                id="curriculum-arrow-dependent"
                markerHeight="8"
                markerWidth="8"
                orient="auto"
                refX="7"
                refY="4"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill="#d97706" />
              </marker>
            </defs>
            {graph.edges.map((edge) => {
              const relation = getEdgeRelation(edge, hoveredSubjectId);

              return (
                <path
                  key={`${edge.from.id}-${edge.to.id}`}
                  d={buildEdgePath(edge.from, edge.to)}
                  fill="none"
                  stroke={getEdgeStroke(relation)}
                  strokeOpacity={getEdgeOpacity(relation, hoveredSubjectId)}
                  strokeWidth={relation === "none" ? 2 : 3}
                  markerEnd={getEdgeMarker(relation, hoveredSubjectId)}
                />
              );
            })}
          </svg>

          {graph.semesters.map((semester) => (
            <div
              key={semester.number}
              className="absolute top-4 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
              style={{
                left: semester.x,
                width: graphNodeWidth,
              }}
            >
              Semestre {semester.number}
            </div>
          ))}

          {graph.nodes.map((node) => {
            const relation = getNodeRelation(node, graph.edges, hoveredSubjectId);

            return (
              <article
                key={node.subject.subject.id}
                tabIndex={0}
                onMouseEnter={() => setHoveredSubjectId(node.id)}
                onMouseLeave={() => setHoveredSubjectId(null)}
                onFocus={() => setHoveredSubjectId(node.id)}
                onBlur={() => setHoveredSubjectId(null)}
                className={[
                  "absolute rounded-xl border p-3 shadow-sm outline-none transition",
                  node.subject.approved
                    ? "border-emerald-200 bg-emerald-50"
                    : "border-slate-200 bg-white",
                  getNodeHighlightClass(relation, hoveredSubjectId),
                ].join(" ")}
                style={{
                  left: node.x,
                  top: node.y,
                  width: graphNodeWidth,
                  minHeight: graphNodeHeight,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={[
                      "text-xs font-bold",
                      node.subject.approved
                        ? "text-emerald-700"
                        : "text-slate-500",
                    ].join(" ")}
                  >
                    {node.subject.subject.code}
                  </p>
                  <span
                    className={[
                      "shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-bold",
                      node.subject.approved
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {node.subject.approved ? "Aprobada" : "No cursada"}
                  </span>
                </div>
                <h4 className="mt-2 text-sm font-bold leading-5 text-[#031b46]">
                  {node.subject.subject.name}
                </h4>
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {node.subject.credits} UC · Nota mínima{" "}
                  {node.subject.minPassingGrade}
                </p>
                {relation !== "none" && (
                  <p
                    className={[
                      "mt-2 text-xs font-bold",
                      relation === "selected"
                        ? "text-[#031b46]"
                        : relation === "prerequisite"
                          ? "text-blue-700"
                          : "text-amber-700",
                    ].join(" ")}
                  >
                    {getRelationLabel(relation)}
                  </p>
                )}
              </article>
            );
          })}

          <div className="absolute bottom-4 left-6 flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-blue-600" />
              Prelación requerida
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-6 rounded-full bg-amber-600" />
              Materia prelable
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function EnrollmentTable({
  enrollments,
  title = "Materias recientes",
  emptyMessage = "No hay materias para mostrar.",
  onCancel,
  cancelingEnrollmentId,
  canCancel = false,
}: {
  enrollments: Enrollment[];
  title?: string;
  emptyMessage?: string;
  onCancel?: (enrollmentId: string) => void;
  cancelingEnrollmentId?: string | null;
  canCancel?: boolean;
}) {
  if (enrollments.length === 0) {
    return <EmptyState icon={BookOpen} message={emptyMessage} />;
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-[#031b46]">{title}</h3>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-240 text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">Materia</th>
              <th className="px-4 py-3 font-bold">Sección</th>
              <th className="px-4 py-3 font-bold">Profesor</th>
              <th className="px-4 py-3 font-bold">Período</th>
              <th className="px-4 py-3 font-bold">Nota</th>
              <th className="px-4 py-3 font-bold">Estado</th>
              {onCancel && <th className="px-4 py-3 font-bold">Acción</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {enrollments.map((enrollment) => (
              <tr key={enrollment.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-800">
                    {enrollment.subject.name}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-amber-700">
                    {enrollment.subject.code} · {enrollment.subject.credits} UC
                  </p>
                </td>
                <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                  {enrollment.section.code}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {enrollment.section.professorName ?? "Sin profesor"}
                </td>
                <td className="px-4 py-4 text-sm text-slate-600">
                  {enrollment.termCode}
                </td>
                <td className="px-4 py-4 text-sm font-bold text-[#031b46]">
                  {enrollment.finalGrade ?? "Pendiente"}
                </td>
                <td className="px-4 py-4">
                  <StatusBadge
                    label={enrollment.gradeStatus ?? enrollment.status}
                    tone={enrollment.gradeStatus === "PASSED" ? "success" : "neutral"}
                  />
                </td>
                {onCancel && (
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => onCancel(enrollment.id)}
                      disabled={!canCancel || cancelingEnrollmentId !== null}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <Trash2 className="h-4 w-4" />
                      {cancelingEnrollmentId === enrollment.id
                        ? "Cancelando..."
                        : "Cancelar"}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail: string;
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
          <p className="mt-1 break-words text-xs text-slate-500">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-700">{children}</dd>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  message,
}: {
  icon: ComponentType<{ className?: string }>;
  message: string;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <Icon className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-600">{message}</p>
    </section>
  );
}

function InlineNotice({
  icon: Icon,
  tone,
  message,
}: {
  icon: ComponentType<{ className?: string }>;
  tone: "success" | "error";
  message: string;
}) {
  const className =
    tone === "success"
      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
      : "border-red-100 bg-red-50 text-red-700";

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function StatusBadge({
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

function getProgress(approvedCredits: number, totalCredits: number) {
  if (totalCredits <= 0) return 0;
  return Math.round((approvedCredits / totalCredits) * 100);
}

function isEnrollmentInActiveAcademicTerm(enrollment: Enrollment) {
  return (
    activeEnrollmentStatuses.has(enrollment.status) &&
    enrollment.termStatus === "ACTIVE"
  );
}

function groupOfferingsBySubject(offerings: EnrollmentOffering[]) {
  const groups = new Map<
    string,
    {
      subject: EnrollmentOffering["subject"];
      sections: EnrollmentOffering[];
    }
  >();

  for (const offering of offerings) {
    const existing = groups.get(offering.subject.id);

    if (existing) {
      existing.sections.push(offering);
    } else {
      groups.set(offering.subject.id, {
        subject: offering.subject,
        sections: [offering],
      });
    }
  }

  return [...groups.values()];
}

function formatModality(value: string) {
  const labels: Record<string, string> = {
    IN_PERSON: "Presencial",
    ONLINE: "En linea",
    HYBRID: "Hibrida",
  };

  return labels[value] ?? value;
}

function getDayLabel(value: string) {
  const day = allWeekDays.find((weekDay) => weekDay.value === value);
  return day?.label ?? value;
}

const graphNodeWidth = 220;
const graphNodeHeight = 132;
const graphColumnGap = 72;
const graphRowGap = 28;
const graphPaddingX = 24;
const graphHeaderHeight = 56;
const graphPaddingBottom = 72;

type GraphRelation = "selected" | "prerequisite" | "dependent" | "none";

type CurriculumGraphNode = {
  id: string;
  subject: CurriculumSubject;
  x: number;
  y: number;
};

type CurriculumGraphEdge = {
  from: CurriculumGraphNode;
  to: CurriculumGraphNode;
};

function buildCurriculumGraph(subjects: CurriculumSubject[]) {
  const semesters = [...new Set(subjects.map((subject) => subject.semesterNumber))]
    .sort((left, right) => left - right)
    .map((semesterNumber, index) => ({
      number: semesterNumber,
      x: graphPaddingX + index * (graphNodeWidth + graphColumnGap),
    }));
  const semesterXByNumber = new Map(
    semesters.map((semester) => [semester.number, semester.x]),
  );
  const nodes = subjects
    .map((subject) => {
      const subjectsInSemester = subjects
        .filter((candidate) => candidate.semesterNumber === subject.semesterNumber)
        .sort((left, right) =>
          left.subject.code.localeCompare(right.subject.code, "es-VE"),
        );
      const rowIndex = subjectsInSemester.findIndex(
        (candidate) => candidate.subject.id === subject.subject.id,
      );

      return {
        id: subject.subject.id,
        subject,
        x: semesterXByNumber.get(subject.semesterNumber) ?? graphPaddingX,
        y: graphHeaderHeight + rowIndex * (graphNodeHeight + graphRowGap),
      };
    })
    .sort((left, right) => left.x - right.x || left.y - right.y);
  const nodeBySubjectId = new Map(nodes.map((node) => [node.id, node]));
  const edges = nodes.flatMap((node) =>
    node.subject.prerequisiteSubjectIds.flatMap((prerequisiteSubjectId) => {
      const prerequisiteNode = nodeBySubjectId.get(prerequisiteSubjectId);

      return prerequisiteNode ? [{ from: prerequisiteNode, to: node }] : [];
    }),
  );
  const maxRows = Math.max(
    1,
    ...semesters.map(
      (semester) =>
        subjects.filter((subject) => subject.semesterNumber === semester.number)
          .length,
    ),
  );
  const width =
    graphPaddingX * 2 +
    semesters.length * graphNodeWidth +
    Math.max(0, semesters.length - 1) * graphColumnGap;
  const height =
    graphHeaderHeight +
    maxRows * graphNodeHeight +
    Math.max(0, maxRows - 1) * graphRowGap +
    graphPaddingBottom;

  return { edges, height, nodes, semesters, width };
}

function buildEdgePath(from: CurriculumGraphNode, to: CurriculumGraphNode) {
  const startX = from.x + graphNodeWidth;
  const startY = from.y + graphNodeHeight / 2;
  const endX = to.x;
  const endY = to.y + graphNodeHeight / 2;
  const midX = startX + Math.max(24, (endX - startX) / 2);

  return `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX - 8} ${endY}`;
}

function getNodeRelation(
  node: CurriculumGraphNode,
  edges: CurriculumGraphEdge[],
  hoveredSubjectId: string | null,
): GraphRelation {
  if (!hoveredSubjectId) return "none";
  if (node.id === hoveredSubjectId) return "selected";

  const isPrerequisite = edges.some(
    (edge) => edge.from.id === node.id && edge.to.id === hoveredSubjectId,
  );
  if (isPrerequisite) return "prerequisite";

  const isDependent = edges.some(
    (edge) => edge.from.id === hoveredSubjectId && edge.to.id === node.id,
  );
  if (isDependent) return "dependent";

  return "none";
}

function getEdgeRelation(
  edge: CurriculumGraphEdge,
  hoveredSubjectId: string | null,
): GraphRelation {
  if (!hoveredSubjectId) return "none";
  if (edge.to.id === hoveredSubjectId) return "prerequisite";
  if (edge.from.id === hoveredSubjectId) return "dependent";
  return "none";
}

function getNodeHighlightClass(
  relation: GraphRelation,
  hoveredSubjectId: string | null,
) {
  if (!hoveredSubjectId) return "hover:-translate-y-0.5 hover:shadow-md";

  if (relation === "selected") {
    return "z-30 -translate-y-1 ring-3 ring-[#031b46]/25 shadow-lg";
  }

  if (relation === "prerequisite") {
    return "z-20 -translate-y-0.5 border-blue-300 ring-3 ring-blue-100 shadow-md";
  }

  if (relation === "dependent") {
    return "z-20 -translate-y-0.5 border-amber-300 ring-3 ring-amber-100 shadow-md";
  }

  return "opacity-35";
}

function getEdgeStroke(relation: GraphRelation) {
  if (relation === "prerequisite") return "#2563eb";
  if (relation === "dependent") return "#d97706";
  return "#94a3b8";
}

function getEdgeOpacity(
  relation: GraphRelation,
  hoveredSubjectId: string | null,
) {
  if (!hoveredSubjectId) return 1;
  return relation === "none" ? 0.12 : 1;
}

function getEdgeMarker(
  relation: GraphRelation,
  hoveredSubjectId: string | null,
) {
  if (relation === "prerequisite") return "url(#curriculum-arrow-prerequisite)";
  if (relation === "dependent") return "url(#curriculum-arrow-dependent)";
  if (hoveredSubjectId) return undefined;
  if (relation === "none") return "url(#curriculum-arrow)";
  return "url(#curriculum-arrow)";
}

function getRelationLabel(relation: GraphRelation) {
  if (relation === "selected") return "Materia seleccionada";
  if (relation === "prerequisite") return "Prela esta materia";
  if (relation === "dependent") return "Depende de esta materia";
  return "";
}

function formatNullableNumber(value: number | null) {
  if (value === null) return "Sin promedio";
  return new Intl.NumberFormat("es-VE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

const allWeekDays = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

const weekDays = allWeekDays.slice(0, 5);
const weekdayValues = new Set(weekDays.map((day) => day.value));

function dayColumnIndex(day: string) {
  const index = weekDays.findIndex((weekDay) => weekDay.value === day);
  return index >= 0 ? index : 0;
}

function getScheduleGridBounds(
  scheduleBlocks: { startMinute: number; endMinute: number }[],
) {
  const startMinute = Math.floor(
    Math.min(...scheduleBlocks.map((block) => block.startMinute)) / 60,
  ) * 60;
  const endMinute = Math.ceil(
    Math.max(...scheduleBlocks.map((block) => block.endMinute)) / 60,
  ) * 60;

  return { startMinute, endMinute };
}

function buildTimeSlots(startMinute: number, endMinute: number) {
  const slots = [];

  for (let minute = startMinute; minute < endMinute; minute += 30) {
    slots.push(minute);
  }

  return slots;
}
