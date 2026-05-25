import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  Mail,
  UserRound,
} from "lucide-react";
import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { StudentDetailEditForm } from "./StudentDetailEditForm";

type StudentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function StudentDetailPage({
  params,
}: StudentDetailPageProps) {
  await requireAdmin();

  const { id } = await params;
  const student = await prisma.studentProfile.findUnique({
    where: { id },
    include: {
      user: true,
      admissionTerm: true,
      currentCareerOption: {
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
      curriculum: true,
      enrollments: {
        orderBy: [{ section: { subject: { code: "asc" } } }],
        include: {
          enrollmentPeriod: true,
          section: {
            include: {
              term: true,
              subject: {
                include: {
                  department: true,
                },
              },
              professor: {
                include: {
                  user: true,
                },
              },
              schedules: {
                orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
                include: {
                  classroom: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  const activeEnrollments = student.enrollments.filter(
    (enrollment) =>
      enrollment.status === "PENDING" || enrollment.status === "ENROLLED",
  );
  const scheduleBlocks = activeEnrollments
    .flatMap((enrollment) =>
      enrollment.section.schedules.map((schedule) => ({
        id: `${enrollment.id}-${schedule.id}`,
        dayOfWeek: schedule.dayOfWeek,
        startMinute: schedule.startMinute,
        endMinute: schedule.endMinute,
        subjectCode: enrollment.section.subject.code,
        subjectName: enrollment.section.subject.name,
        sectionCode: enrollment.section.sectionCode,
        professorName: enrollment.section.professor?.user.name ?? "Sin profesor",
        classroomCode: schedule.classroom?.code ?? "Sin aula",
      })),
    )
    .sort(
      (left, right) =>
        dayColumnIndex(left.dayOfWeek) - dayColumnIndex(right.dayOfWeek) ||
        left.startMinute - right.startMinute,
    );
  const scheduleBounds = getScheduleGridBounds(scheduleBlocks);
  const timeSlots = buildTimeSlots(scheduleBounds.startMinute, scheduleBounds.endMinute);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/students"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#031b46]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a estudiantes
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
                {student.studentCode}
              </p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                {student.user.name ?? "Sin nombre"}
              </h1>
              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-200">
                {student.currentCareerOption.career.name} ·{" "}
                {student.currentCareerOption.name} ·{" "}
                {student.currentCareerOption.career.school.name} ·{" "}
                {student.currentCareerOption.career.school.faculty.name}
              </p>
            </div>
          </div>

          <StatusPill status={student.status} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard
          icon={Mail}
          label="Correo"
          value={student.user.email}
          detail={student.user.institutionalId}
        />
        <InfoCard
          icon={CalendarDays}
          label="Período de ingreso"
          value={student.admissionTerm?.code ?? "Sin período"}
          detail={
            student.admissionTerm
              ? `Inicio ${formatDate(student.admissionTerm.startsAt)}`
              : "No registrado"
          }
        />
        <InfoCard
          icon={BookOpen}
          label="Pensum"
          value={student.curriculum.name}
          detail={student.curriculum.code}
        />
        <InfoCard
          icon={UserRound}
          label="Contacto"
          value={student.phone ?? "Sin teléfono"}
          detail={student.nationalId ?? "Sin C.I. nacional"}
        />
      </section>

      <StudentDetailEditForm
        student={{
          id: student.id,
          studentCode: student.studentCode,
          nationalId: student.nationalId,
          birthDate: student.birthDate ? toInputDate(student.birthDate) : null,
          phone: student.phone,
          address: student.address,
          status: student.status,
          user: {
            name: student.user.name,
            email: student.user.email,
            institutionalId: student.user.institutionalId,
            status: student.user.status,
          },
        }}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-[#031b46]">
            Materias inscritas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Secciones asignadas al estudiante con profesor, cupo y estado.
          </p>

          {student.enrollments.length === 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                Este estudiante no tiene materias inscritas.
              </p>
            </div>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-220 text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Materia</th>
                    <th className="px-4 py-3 font-bold">Sección</th>
                    <th className="px-4 py-3 font-bold">Profesor</th>
                    <th className="px-4 py-3 font-bold">Período</th>
                    <th className="px-4 py-3 font-bold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {student.enrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">
                          {enrollment.section.subject.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-amber-700">
                          {enrollment.section.subject.code}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {enrollment.section.sectionCode}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {enrollment.section.professor?.user.name ??
                          "Sin profesor"}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {enrollment.section.term.code}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                          {enrollment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#031b46]">
            Datos personales
          </h2>
          <dl className="mt-5 space-y-4">
            <DetailItem label="Fecha de nacimiento">
              {student.birthDate ? formatDate(student.birthDate) : "Sin fecha"}
            </DetailItem>
            <DetailItem label="Dirección">
              {student.address ?? "Sin dirección"}
            </DetailItem>
            <DetailItem label="Estado de acceso">
              {student.user.status}
            </DetailItem>
            <DetailItem label="Registrado">
              {formatDate(student.createdAt)}
            </DetailItem>
          </dl>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#031b46]">
              Horario activo
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Vista semanal separada por días y horas.
            </p>
          </div>
        </div>

        {scheduleBlocks.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600">
            No hay horario activo para mostrar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid min-w-320 rounded-xl border border-slate-200 bg-white"
              style={{
                gridTemplateColumns: "5rem repeat(7, minmax(9rem, 1fr))",
                gridTemplateRows: `3rem repeat(${timeSlots.length}, 2.75rem)`,
              }}
            >
              <div className="sticky left-0 z-20 border-b border-r border-slate-200 bg-slate-50" />
              {weekDays.map((day) => (
                <div
                  key={day.value}
                  className="border-b border-r border-slate-200 bg-slate-50 px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500 last:border-r-0"
                >
                  {day.shortLabel}
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

              {scheduleBlocks.map((block) => {
                const rowStart =
                  Math.floor((block.startMinute - scheduleBounds.startMinute) / 30) + 2;
                const rowSpan = Math.max(
                  1,
                  Math.ceil((block.endMinute - block.startMinute) / 30),
                );

                return (
                  <article
                    key={block.id}
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
                      {formatMinutes(block.startMinute)} -{" "}
                      {formatMinutes(block.endMinute)}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-600">
                      Sec. {block.sectionCode} · {block.classroomCode}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {block.professorName}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: React.ComponentType<{ className?: string }>;
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

function StatusPill({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "SUSPENDED"
        ? "bg-red-50 text-red-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {status}
    </span>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

const weekDays = [
  { value: "MONDAY", shortLabel: "Lunes" },
  { value: "TUESDAY", shortLabel: "Martes" },
  { value: "WEDNESDAY", shortLabel: "Miércoles" },
  { value: "THURSDAY", shortLabel: "Jueves" },
  { value: "FRIDAY", shortLabel: "Viernes" },
  { value: "SATURDAY", shortLabel: "Sábado" },
  { value: "SUNDAY", shortLabel: "Domingo" },
];

function dayColumnIndex(day: string) {
  const index = weekDays.findIndex((weekDay) => weekDay.value === day);
  return index >= 0 ? index : 0;
}

function getScheduleGridBounds(
  scheduleBlocks: { startMinute: number; endMinute: number }[],
) {
  if (scheduleBlocks.length === 0) {
    return { startMinute: 420, endMinute: 1260 };
  }

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
