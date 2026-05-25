"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Mail,
  Users,
} from "lucide-react";

type ProfessorDashboardData = {
  professor: {
    name: string | null;
    email: string;
    institutionalId: string;
    employeeCode: string;
    phone: string | null;
    academicTitle: string | null;
    office: string | null;
    department: {
      name: string;
      code: string;
      faculty: string;
    } | null;
  };
  summary: {
    activeSections: number;
    assignedSections: number;
    activeStudents: number;
  };
  activeSections: ProfessorSectionSummary[];
};

type ProfessorSectionSummary = {
  id: string;
  code: string;
  status: string;
  modality: string;
  capacity: number;
  studentsCount: number;
  subject: {
    code: string;
    name: string;
    credits: number;
    department: string;
    faculty: string;
  };
  term: {
    code: string;
    startsAt: string;
    endsAt: string;
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
  data?: ProfessorDashboardData;
  message?: string;
};

export function ProfessorDashboardClient() {
  const [data, setData] = useState<ProfessorDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      try {
        const response = await fetch("/api/professor/dashboard", {
          headers: { Accept: "application/json" },
        });
        const payload = (await response.json()) as ApiResponse;

        if (!response.ok) {
          throw new Error(payload.message ?? "No se pudo cargar el dashboard");
        }

        if (!payload.data) {
          throw new Error("La respuesta no incluyo datos del profesor");
        }

        if (!ignore) {
          setData(payload.data);
          setError(null);
        }
      } catch (caughtError) {
        if (!ignore) {
          setError(
            caughtError instanceof Error
              ? caughtError.message
              : "No se pudo cargar el dashboard",
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  if (loading) {
    return <PanelMessage message="Cargando informacion del profesor..." />;
  }

  if (error || !data) {
    return (
      <PanelMessage
        tone="error"
        title="No se pudo cargar el dashboard"
        message={error ?? "Intenta nuevamente."}
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
                {data.professor.employeeCode}
              </p>
              <h2 className="mt-1 text-2xl font-bold md:text-3xl">
                {data.professor.name ?? "Profesor"}
              </h2>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
                {data.professor.academicTitle ?? "Docente"} ·{" "}
                {data.professor.department
                  ? `${data.professor.department.name} · ${data.professor.department.faculty}`
                  : "Sin departamento asignado"}
              </p>
            </div>
          </div>

          <Link
            href="/professor/sections"
            className="w-fit rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-[#031b46] transition hover:bg-amber-300"
          >
            Ver secciones
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <InfoCard
          icon={BookOpen}
          label="Secciones activas"
          value={String(data.summary.activeSections)}
          detail={`${data.summary.assignedSections} asignadas en total`}
        />
        <InfoCard
          icon={Users}
          label="Estudiantes activos"
          value={String(data.summary.activeStudents)}
          detail="En secciones abiertas del periodo activo"
        />
        <InfoCard
          icon={Mail}
          label="Contacto"
          value={data.professor.email}
          detail={data.professor.phone ?? data.professor.institutionalId}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-1">
          <h3 className="text-lg font-bold text-[#031b46]">Datos del profesor</h3>
          <dl className="mt-5 space-y-4">
            <DetailItem label="ID institucional">
              {data.professor.institutionalId}
            </DetailItem>
            <DetailItem label="Telefono">
              {data.professor.phone ?? "Sin telefono registrado"}
            </DetailItem>
            <DetailItem label="Oficina">
              {data.professor.office ?? "Sin oficina registrada"}
            </DetailItem>
            <DetailItem label="Departamento">
              {data.professor.department?.name ?? "Sin departamento"}
            </DetailItem>
          </dl>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-bold text-[#031b46]">
              Secciones activas
            </h3>
            <span className="text-sm font-semibold text-slate-500">
              {data.summary.activeSections} abiertas
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {data.activeSections.length === 0 ? (
              <p className="rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                No hay secciones activas en este momento.
              </p>
            ) : (
              data.activeSections.map((section) => (
                <SectionRow key={section.id} section={section} />
              ))
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function SectionRow({ section }: { section: ProfessorSectionSummary }) {
  return (
    <Link
      href={`/professor/sections/${section.id}`}
      className="block rounded-xl border border-slate-200 p-4 transition hover:border-amber-300 hover:bg-amber-50/30"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#031b46]">
            {section.subject.code} · {section.subject.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-amber-700">
            Seccion {section.code} · {section.term.code} ·{" "}
            {section.subject.credits} UC
          </p>
        </div>
        <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {section.studentsCount}/{section.capacity} estudiantes
        </span>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
        <Clock className="h-4 w-4" />
        {formatSchedules(section.schedules)}
      </p>
    </Link>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof BookOpen;
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
  children: React.ReactNode;
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

function formatSchedules(schedules: ProfessorSectionSummary["schedules"]) {
  if (schedules.length === 0) return "Sin horario registrado";

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
