"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, CalendarDays, Clock, Users } from "lucide-react";

type ProfessorSectionsView = "sections" | "schedule";

type ProfessorSection = {
  id: string;
  code: string;
  status: string;
  modality: string;
  capacity: number;
  studentsCount: number;
  gradesLocked: boolean;
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
};

type ApiResponse = {
  data?: ProfessorSection[];
  message?: string;
};

export function ProfessorSectionsClient({
  view,
}: {
  view: ProfessorSectionsView;
}) {
  const [sections, setSections] = useState<ProfessorSection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadSections() {
      try {
        const response = await fetch("/api/professor/sections", {
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(payload.message ?? "No se pudieron cargar las secciones");
        }

        if (!ignore) {
          setSections(payload.data ?? []);
          setError(null);
        }
      } catch (caughtError) {
        if (!ignore) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "No se pudieron cargar las secciones",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadSections();

    return () => {
      ignore = true;
    };
  }, []);

  const activeSections = useMemo(
    () =>
      sections.filter(
        (section) =>
          section.term.status === "ACTIVE" && section.status === "OPEN",
      ),
    [sections],
  );
  const currentTermGroups = useMemo(
    () => groupSectionsByTerm(sections.filter((section) => section.term.status === "ACTIVE")),
    [sections],
  );
  const previousTermGroups = useMemo(
    () => groupSectionsByTerm(sections.filter((section) => section.term.status !== "ACTIVE")),
    [sections],
  );

  if (loading) {
    return <PanelMessage message="Cargando secciones..." />;
  }

  if (error) {
    return (
      <PanelMessage
        tone="error"
        title="No se pudieron cargar las secciones"
        message={error}
      />
    );
  }

  if (view === "schedule") {
    return <ScheduleView sections={sections} />;
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-[#031b46] md:text-3xl">
          Secciones
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Materias asignadas al profesor por periodo academico.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          icon={BookOpen}
          label="Activas"
          value={String(activeSections.length)}
        />
        <MetricCard icon={CalendarDays} label="Total" value={String(sections.length)} />
        <MetricCard
          icon={Users}
          label="Estudiantes"
          value={String(
            activeSections.reduce(
              (total, section) => total + section.studentsCount,
              0,
            ),
          )}
        />
      </section>

      {sections.length === 0 ? (
        <PanelMessage message="No tienes secciones asignadas." />
      ) : (
        <div className="space-y-6">
          {currentTermGroups.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#031b46]">
                  Semestre actual
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Secciones del periodo academico activo.
                </p>
              </div>

              {currentTermGroups.map((group) => (
                <SectionTermGroup key={group.termCode} group={group} />
              ))}
            </section>
          ) : null}

          {previousTermGroups.length > 0 ? (
            <section className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-[#031b46]">
                  Semestres anteriores
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Secciones agrupadas por el periodo en que fueron dictadas.
                </p>
              </div>

              {previousTermGroups.map((group) => (
                <SectionTermGroup key={group.termCode} group={group} />
              ))}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ScheduleView({ sections }: { sections: ProfessorSection[] }) {
  const scheduleBlocks = sections.flatMap((section) =>
    section.schedules
      .filter((schedule) => weekdayOrder.includes(schedule.dayOfWeek))
      .map((schedule) => ({
        id: schedule.id,
        sectionId: section.id,
        sectionCode: section.code,
        subjectCode: section.subject.code,
        subjectName: section.subject.name,
        termCode: section.term.code,
        dayOfWeek: schedule.dayOfWeek,
        startMinute: schedule.startMinute,
        endMinute: schedule.endMinute,
        classroomCode: schedule.classroomCode,
        classroomLocation: schedule.classroomLocation,
      })),
  );
  const scheduleStartMinute =
    scheduleBlocks.length > 0
      ? Math.floor(
          Math.min(...scheduleBlocks.map((block) => block.startMinute)) / 60,
        ) * 60
      : 420;
  const scheduleEndMinute =
    scheduleBlocks.length > 0
      ? Math.ceil(Math.max(...scheduleBlocks.map((block) => block.endMinute)) / 60) *
        60
      : 1080;
  const hours = Array.from(
    { length: Math.max((scheduleEndMinute - scheduleStartMinute) / 60 + 1, 1) },
    (_, index) => scheduleStartMinute + index * 60,
  );
  const gridHeight = Math.max(
    ((scheduleEndMinute - scheduleStartMinute) / 60) * hourHeight,
    hourHeight,
  );

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold text-[#031b46] md:text-3xl">
          Horario
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Bloques de clase registrados en las secciones asignadas.
        </p>
      </section>

      {scheduleBlocks.length === 0 ? (
        <PanelMessage message="No hay horarios registrados de lunes a viernes." />
      ) : (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-240">
              <div className="grid grid-cols-[5rem_repeat(5,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
                <div className="border-r border-slate-200 px-3 py-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Hora
                </div>
                {weekdayOrder.map((day) => (
                  <div
                    key={day}
                    className="border-r border-slate-200 px-4 py-4 text-center text-sm font-bold text-[#031b46] last:border-r-0"
                  >
                    {dayLabels[day]}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[5rem_repeat(5,minmax(0,1fr))]">
                <div
                  className="relative border-r border-slate-200 bg-slate-50"
                  style={{ height: gridHeight }}
                >
                  {hours.slice(0, -1).map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-t border-slate-200 px-3 pt-2 text-xs font-semibold text-slate-500"
                      style={{
                        top: ((hour - scheduleStartMinute) / 60) * hourHeight,
                      }}
                    >
                      {formatMinute(hour)}
                    </div>
                  ))}
                </div>

                {weekdayOrder.map((day) => (
                  <div
                    key={day}
                    className="relative border-r border-slate-200 last:border-r-0"
                    style={{ height: gridHeight }}
                  >
                    {hours.slice(0, -1).map((hour) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{
                          top:
                            ((hour - scheduleStartMinute) / 60) * hourHeight,
                        }}
                      />
                    ))}

                    {scheduleBlocks
                      .filter((block) => block.dayOfWeek === day)
                      .map((block, index) => (
                        <Link
                          key={block.id}
                          href={`/professor/sections/${block.sectionId}`}
                          className="absolute left-2 right-2 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 p-3 text-left shadow-sm transition hover:border-amber-300 hover:bg-amber-100"
                          style={{
                            top:
                              ((block.startMinute - scheduleStartMinute) / 60) *
                                hourHeight +
                              6,
                            height: Math.max(
                              ((block.endMinute - block.startMinute) / 60) *
                                hourHeight -
                                12,
                              58,
                            ),
                            zIndex: index + 1,
                          }}
                        >
                          <p className="truncate text-xs font-bold text-amber-700">
                            {formatMinute(block.startMinute)} -{" "}
                            {formatMinute(block.endMinute)}
                          </p>
                          <p className="mt-1 line-clamp-2 text-sm font-bold text-[#031b46]">
                            {block.subjectCode} · {block.subjectName}
                          </p>
                          <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                            Sec. {block.sectionCode} · {block.termCode}
                          </p>
                          <p className="mt-1 truncate text-xs text-slate-500">
                            {block.classroomCode ?? "Sin aula"}{" "}
                            {block.classroomLocation}
                          </p>
                        </Link>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function SectionCard({ section }: { section: ProfessorSection }) {
  return (
    <Link
      href={`/professor/sections/${section.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-amber-300 hover:bg-amber-50/30"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-bold text-[#031b46]">
            {section.subject.code} · {section.subject.name}
          </p>
          <p className="mt-2 text-sm font-semibold text-amber-700">
            Seccion {section.code} · {section.term.code} ·{" "}
            {section.subject.credits} UC
          </p>
        </div>
        <StatusBadge label={section.status} />
      </div>

      <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-amber-500" />
          {section.studentsCount}/{section.capacity} estudiantes
        </span>
        <span className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          {formatSchedules(section.schedules)}
        </span>
      </div>
    </Link>
  );
}

function SectionTermGroup({ group }: { group: SectionGroup }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h4 className="text-base font-bold text-[#031b46]">
            {group.termCode}
          </h4>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {formatDate(group.startsAt)} - {formatDate(group.endsAt)}
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {group.sections.length} seccion{group.sections.length === 1 ? "" : "es"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {group.sections.map((section) => (
          <SectionCard key={section.id} section={section} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-[#031b46]">{value}</p>
        </div>
      </div>
    </article>
  );
}

function StatusBadge({ label }: { label: string }) {
  return (
    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
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

function formatSchedules(schedules: ProfessorSection["schedules"]) {
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function groupSectionsByTerm(sections: ProfessorSection[]) {
  const groups = new Map<string, SectionGroup>();

  for (const section of sections) {
    const existingGroup = groups.get(section.term.code);

    if (existingGroup) {
      existingGroup.sections.push(section);
      continue;
    }

    groups.set(section.term.code, {
      termCode: section.term.code,
      termStatus: section.term.status,
      startsAt: section.term.startsAt,
      endsAt: section.term.endsAt,
      sections: [section],
    });
  }

  return Array.from(groups.values());
}

type SectionGroup = {
  termCode: string;
  termStatus: string;
  startsAt: string;
  endsAt: string;
  sections: ProfessorSection[];
};

const dayLabels: Record<string, string> = {
  MONDAY: "Lunes",
  TUESDAY: "Martes",
  WEDNESDAY: "Miercoles",
  THURSDAY: "Jueves",
  FRIDAY: "Viernes",
  SATURDAY: "Sabado",
  SUNDAY: "Domingo",
};

const weekdayOrder = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
];
const hourHeight = 72;
