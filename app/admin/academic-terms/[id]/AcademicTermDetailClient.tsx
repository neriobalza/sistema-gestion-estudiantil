"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

type AcademicPeriod = "FIRST" | "SECOND" | "SUMMER";
type TermStatus = "PLANNED" | "ACTIVE" | "CLOSED";
type SectionStatus = "PLANNED" | "OPEN" | "CLOSED" | "CANCELLED";
type Modality = "IN_PERSON" | "ONLINE" | "HYBRID";
type DayOfWeekValue =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type TermDetail = {
  id: string;
  code: string;
  year: number;
  period: AcademicPeriod;
  startsAt: string;
  endsAt: string;
  status: TermStatus;
  enrollmentPeriods: Array<{
    id: string;
    name: string;
    startsAt: string;
    endsAt: string;
    status: string;
    facultyName: string | null;
    schoolName: string | null;
    careerName: string | null;
    careerOptionName: string | null;
  }>;
  sections: SectionItem[];
  counts: {
    enrollmentPeriods: number;
    sections: number;
    admittedStudents: number;
    curriculaEffective: number;
  };
};

type SectionItem = {
  id: string;
  subjectId: string;
  professorId: string | null;
  sectionCode: string;
  capacity: number;
  modality: Modality;
  status: SectionStatus;
  subject: {
    code: string;
    name: string;
    departmentName: string;
  };
  professor: {
    employeeCode: string;
    name: string | null;
  } | null;
  schedules: ScheduleItem[];
  enrollmentsCount: number;
  gradeItemsCount: number;
};

type ScheduleItem = {
  id: string;
  classroomId: string | null;
  dayOfWeek: DayOfWeekValue;
  startMinute: number;
  endMinute: number;
  classroom: {
    code: string;
    building: string | null;
    room: string | null;
  } | null;
};

type SubjectOption = {
  id: string;
  code: string;
  name: string;
  department: {
    name: string;
    facultyId: string;
  };
};

type ProfessorOption = {
  id: string;
  employeeCode: string;
  user: {
    name: string | null;
  };
  department: {
    facultyId: string;
    name: string;
  } | null;
};

type ClassroomOption = {
  id: string;
  facultyId: string;
  code: string;
  building: string | null;
  room: string | null;
  capacity: number | null;
};

type SectionDraft = {
  subjectId: string;
  professorId: string;
  sectionCode: string;
  capacity: string;
  modality: Modality;
  status: SectionStatus;
  schedules: ScheduleDraft[];
};

type ScheduleDraft = {
  id: string;
  classroomId: string;
  dayOfWeek: DayOfWeekValue;
  startTime: string;
  endTime: string;
};

type ApiResponse = {
  message?: string;
  data?: {
    id?: string;
    schedules?: ApiScheduleResponse[];
  };
  errors?: Record<string, string[] | undefined>;
};

type ApiScheduleResponse = {
  id: string;
  classroomId: string | null;
  dayOfWeek: DayOfWeekValue;
  startMinute: number;
  endMinute: number;
};

export function AcademicTermDetailClient({
  term,
  subjects,
  professors,
  classrooms,
}: {
  term: TermDetail;
  subjects: SubjectOption[];
  professors: ProfessorOption[];
  classrooms: ClassroomOption[];
}) {
  const router = useRouter();
  const [termForm, setTermForm] = useState({
    code: term.code,
    year: String(term.year),
    period: term.period,
    startsAt: term.startsAt,
    endsAt: term.endsAt,
    status: term.status,
  });
  const [sections, setSections] = useState(term.sections);
  const [sectionDraft, setSectionDraft] = useState<SectionDraft>(
    createEmptySectionDraft(),
  );
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [isSavingTerm, setIsSavingTerm] = useState(false);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const editingSection = editingSectionId
    ? sections.find((section) => section.id === editingSectionId) ?? null
    : null;

  function updateTermField(field: keyof typeof termForm, value: string) {
    setTermForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updateSectionField(field: keyof SectionDraft, value: string) {
    setSectionDraft((currentDraft) => ({
      ...currentDraft,
      [field]: value,
    }));
  }

  function updateScheduleField(
    scheduleId: string,
    field: keyof ScheduleDraft,
    value: string,
  ) {
    setSectionDraft((currentDraft) => ({
      ...currentDraft,
      schedules: currentDraft.schedules.map((schedule) =>
        schedule.id === scheduleId ? { ...schedule, [field]: value } : schedule,
      ),
    }));
  }

  function addSchedule() {
    setSectionDraft((currentDraft) => ({
      ...currentDraft,
      schedules: [...currentDraft.schedules, createEmptyScheduleDraft()],
    }));
  }

  function removeSchedule(scheduleId: string) {
    setSectionDraft((currentDraft) => ({
      ...currentDraft,
      schedules:
        currentDraft.schedules.length === 1
          ? [createEmptyScheduleDraft()]
          : currentDraft.schedules.filter((schedule) => schedule.id !== scheduleId),
    }));
  }

  function startEditingSection(section: SectionItem) {
    setEditingSectionId(section.id);
    setSectionDraft({
      subjectId: section.subjectId,
      professorId: section.professorId ?? "",
      sectionCode: section.sectionCode,
      capacity: String(section.capacity),
      modality: section.modality,
      status: section.status,
      schedules: section.schedules.map((schedule) => ({
        id: schedule.id,
        classroomId: schedule.classroomId ?? "",
        dayOfWeek: schedule.dayOfWeek,
        startTime: minutesToTime(schedule.startMinute),
        endTime: minutesToTime(schedule.endMinute),
      })),
    });
    setSuccessMessage("");
    setErrorMessage("");
  }

  function cancelSectionEditing() {
    if (isSavingSection) return;
    setEditingSectionId(null);
    setSectionDraft(createEmptySectionDraft());
    setErrorMessage("");
  }

  async function handleTermSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingTerm(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/academic-terms/${term.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(termForm),
      });
      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      setSuccessMessage(
        result?.message ?? "Periodo academico actualizado correctamente.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el periodo academico.",
      );
    } finally {
      setIsSavingTerm(false);
    }
  }

  async function handleSectionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingSection(true);
    setSuccessMessage("");
    setErrorMessage("");

    const payload = {
      termId: term.id,
      subjectId: sectionDraft.subjectId,
      professorId: sectionDraft.professorId,
      sectionCode: sectionDraft.sectionCode,
      capacity: sectionDraft.capacity,
      modality: sectionDraft.modality,
      status: sectionDraft.status,
      schedules: sectionDraft.schedules.map((schedule) => ({
        classroomId: schedule.classroomId,
        dayOfWeek: schedule.dayOfWeek,
        startMinute: timeToMinutes(schedule.startTime),
        endMinute: timeToMinutes(schedule.endTime),
      })),
    };
    const endpoint = editingSectionId
      ? `/api/admin/course-sections/${editingSectionId}`
      : "/api/admin/course-sections";

    try {
      const response = await fetch(endpoint, {
        method: editingSectionId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      const normalizedSection = buildSectionFromDraft(
        result?.data?.id ?? editingSectionId ?? crypto.randomUUID(),
        sectionDraft,
        result?.data?.schedules,
        editingSection,
        subjects,
        professors,
        classrooms,
      );

      setSections((currentSections) =>
        editingSectionId
          ? currentSections.map((section) =>
              section.id === editingSectionId ? normalizedSection : section,
            )
          : [...currentSections, normalizedSection],
      );
      setEditingSectionId(null);
      setSectionDraft(createEmptySectionDraft());
      setSuccessMessage(
        result?.message ??
          (editingSectionId
            ? "Seccion actualizada correctamente."
            : "Seccion creada correctamente."),
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la seccion.",
      );
    } finally {
      setIsSavingSection(false);
    }
  }

  async function handleDeleteSection(section: SectionItem) {
    const confirmed = window.confirm(
      `Eliminar la seccion ${section.subject.code}-${section.sectionCode}?`,
    );

    if (!confirmed) return;

    setIsSavingSection(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/course-sections/${section.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      setSections((currentSections) =>
        currentSections.filter((currentSection) => currentSection.id !== section.id),
      );
      if (editingSectionId === section.id) {
        setEditingSectionId(null);
        setSectionDraft(createEmptySectionDraft());
      }
      setSuccessMessage(result?.message ?? "Seccion eliminada correctamente.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la seccion.",
      );
    } finally {
      setIsSavingSection(false);
    }
  }

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
              {term.period}
            </p>
            <h1 className="mt-1 text-2xl font-bold md:text-3xl">
              Período {term.code}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
              {formatDisplayDate(term.startsAt)} - {formatDisplayDate(term.endsAt)}
            </p>
          </div>
          <StatusPill status={termForm.status} />
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Inscripciones" value={term.counts.enrollmentPeriods} />
        <MetricCard label="Secciones" value={sections.length} />
        <MetricCard label="Admitidos" value={term.counts.admittedStudents} />
        <MetricCard label="Pensums" value={term.counts.curriculaEffective} />
      </section>

      {successMessage && <Alert tone="success" message={successMessage} />}
      {errorMessage && <Alert tone="error" message={errorMessage} />}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-[#031b46]">
            Datos del período
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Edita código, año, tipo de período, fechas y estado.
          </p>
        </div>

        <form onSubmit={handleTermSubmit} className="grid gap-4 xl:grid-cols-7">
          <Field label="Código">
            <input
              required
              value={termForm.code}
              onChange={(event) => updateTermField("code", event.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="Año">
            <input
              required
              type="number"
              min={1900}
              max={2200}
              value={termForm.year}
              onChange={(event) => updateTermField("year", event.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="Período">
            <select
              value={termForm.period}
              onChange={(event) => updateTermField("period", event.target.value)}
              className={inputClassName}
            >
              <option value="FIRST">Primera mitad</option>
              <option value="SECOND">Segunda mitad</option>
              <option value="SUMMER">Verano</option>
            </select>
          </Field>
          <Field label="Inicio">
            <input
              required
              type="date"
              value={termForm.startsAt}
              onChange={(event) => updateTermField("startsAt", event.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="Fin">
            <input
              required
              type="date"
              value={termForm.endsAt}
              onChange={(event) => updateTermField("endsAt", event.target.value)}
              className={inputClassName}
            />
          </Field>
          <Field label="Estado">
            <select
              value={termForm.status}
              onChange={(event) => updateTermField("status", event.target.value)}
              className={inputClassName}
            >
              <option value="PLANNED">Planificado</option>
              <option value="ACTIVE">Activo</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSavingTerm}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSavingTerm ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#031b46]">
            Ventanas de inscripción
          </h2>
        </div>
        {term.enrollmentPeriods.length === 0 ? (
          <EmptyState label="Este período no tiene ventanas de inscripción." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Nombre</th>
                  <th className="px-6 py-4 font-bold">Alcance</th>
                  <th className="px-6 py-4 font-bold">Inicio</th>
                  <th className="px-6 py-4 font-bold">Fin</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {term.enrollmentPeriods.map((period) => (
                  <tr key={period.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">
                      {period.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {period.facultyName ??
                        period.schoolName ??
                        period.careerName ??
                        period.careerOptionName ??
                        "General"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDisplayDate(period.startsAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {formatDisplayDate(period.endsAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {period.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
          <div>
            <h2 className="text-lg font-bold text-[#031b46]">
              {editingSectionId ? "Editar sección" : "Agregar materia y sección"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Registra materias ofertadas con profesor, cupos, modalidad y uno
              o varios horarios.
            </p>
          </div>
          {editingSectionId && (
            <button
              type="button"
              onClick={cancelSectionEditing}
              disabled={isSavingSection}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          )}
        </div>

        <form onSubmit={handleSectionSubmit} className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-8">
            <Field label="Materia" className="xl:col-span-2">
              <select
                required
                value={sectionDraft.subjectId}
                onChange={(event) =>
                  updateSectionField("subjectId", event.target.value)
                }
                className={inputClassName}
              >
                <option value="">Selecciona materia</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.code} - {subject.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Sección">
              <input
                required
                maxLength={20}
                value={sectionDraft.sectionCode}
                onChange={(event) =>
                  updateSectionField("sectionCode", event.target.value)
                }
                className={inputClassName}
              />
            </Field>
            <Field label="Profesor" className="xl:col-span-2">
              <select
                value={sectionDraft.professorId}
                onChange={(event) =>
                  updateSectionField("professorId", event.target.value)
                }
                className={inputClassName}
              >
                <option value="">Sin profesor asignado</option>
                {professors.map((professor) => (
                  <option key={professor.id} value={professor.id}>
                    {professor.employeeCode} -{" "}
                    {professor.user.name ?? "Sin nombre"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Modalidad">
              <select
                value={sectionDraft.modality}
                onChange={(event) =>
                  updateSectionField("modality", event.target.value)
                }
                className={inputClassName}
              >
                <option value="IN_PERSON">Presencial</option>
                <option value="ONLINE">En línea</option>
                <option value="HYBRID">Híbrida</option>
              </select>
            </Field>
            <Field label="Estado">
              <select
                value={sectionDraft.status}
                onChange={(event) =>
                  updateSectionField("status", event.target.value)
                }
                className={inputClassName}
              >
                <option value="PLANNED">Planificada</option>
                <option value="OPEN">Abierta</option>
                <option value="CLOSED">Cerrada</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </Field>
            <Field label="Cupos">
              <input
                required
                type="number"
                min={1}
                value={sectionDraft.capacity}
                onChange={(event) =>
                  updateSectionField("capacity", event.target.value)
                }
                className={inputClassName}
              />
            </Field>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-5">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <h3 className="text-sm font-bold text-[#031b46]">Horarios</h3>
              <button
                type="button"
                onClick={addSchedule}
                disabled={isSavingSection}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-[#031b46] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus className="h-4 w-4" />
                Agregar horario
              </button>
            </div>

            {sectionDraft.schedules.map((schedule, index) => (
              <div
                key={schedule.id}
                className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 xl:grid-cols-8"
              >
                <Field label={`Día ${index + 1}`} className="xl:col-span-2">
                  <select
                    value={schedule.dayOfWeek}
                    onChange={(event) =>
                      updateScheduleField(
                        schedule.id,
                        "dayOfWeek",
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                  >
                    {daysOfWeek.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Salón" className="xl:col-span-2">
                  <select
                    required
                    value={schedule.classroomId}
                    onChange={(event) =>
                      updateScheduleField(
                        schedule.id,
                        "classroomId",
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                  >
                    <option value="">Selecciona salón</option>
                    {classrooms.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {formatClassroom(classroom)}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Inicio">
                  <input
                    required
                    type="time"
                    value={schedule.startTime}
                    onChange={(event) =>
                      updateScheduleField(
                        schedule.id,
                        "startTime",
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                  />
                </Field>
                <Field label="Fin">
                  <input
                    required
                    type="time"
                    value={schedule.endTime}
                    onChange={(event) =>
                      updateScheduleField(
                        schedule.id,
                        "endTime",
                        event.target.value,
                      )
                    }
                    className={inputClassName}
                  />
                </Field>
                <div className="flex items-end xl:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeSchedule(schedule.id)}
                    disabled={isSavingSection}
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar horario
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <button
              type="submit"
              disabled={isSavingSection}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-5 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
            >
              {isSavingSection ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingSectionId ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingSectionId ? "Guardar sección" : "Agregar sección"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="text-lg font-bold text-[#031b46]">
            Materias y secciones
          </h2>
        </div>
        {sections.length === 0 ? (
          <EmptyState label="Este período no tiene secciones registradas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-260 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Materia</th>
                  <th className="px-6 py-4 font-bold">Sección</th>
                  <th className="px-6 py-4 font-bold">Profesor</th>
                  <th className="px-6 py-4 font-bold">Horario</th>
                  <th className="px-6 py-4 font-bold">Cupos</th>
                  <th className="px-6 py-4 font-bold">Estado</th>
                  <th className="px-6 py-4 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sections.map((section) => (
                  <tr key={section.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">
                        {section.subject.code} - {section.subject.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {section.subject.departmentName}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                        {section.sectionCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {section.professor
                        ? `${section.professor.employeeCode} - ${
                            section.professor.name ?? "Sin nombre"
                          }`
                        : "Sin profesor"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        {section.schedules.map((schedule) => (
                          <p key={schedule.id} className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-400" />
                            {getDayLabel(schedule.dayOfWeek)}{" "}
                            {minutesToTime(schedule.startMinute)}-
                            {minutesToTime(schedule.endMinute)}
                            {schedule.classroom
                              ? ` · ${schedule.classroom.code}`
                              : ""}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {section.enrollmentsCount}/{section.capacity}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {section.status}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingSection(section)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#031b46] transition hover:bg-slate-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSection(section)}
                          disabled={isSavingSection}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#031b46]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#031b46]">{value}</p>
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-[#031b46]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Alert({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  const isSuccess = tone === "success";
  const Icon = isSuccess ? CheckCircle2 : AlertTriangle;
  const className = isSuccess
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center px-6 py-10 text-center text-sm font-medium text-slate-500">
      {label}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const className =
    status === "ACTIVE"
      ? "bg-emerald-50 text-emerald-700"
      : status === "PLANNED"
        ? "bg-amber-50 text-amber-700"
        : "bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${className}`}>
      {status}
    </span>
  );
}

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");

    return {
      message: text.trim() || undefined,
    } satisfies ApiResponse;
  }

  return (await response.json().catch(() => null)) as ApiResponse | null;
}

function formatApiError(result: ApiResponse | null, status?: number) {
  const fieldErrors = result?.errors
    ? Object.entries(result.errors)
        .flatMap(([field, messages]) =>
          (messages ?? []).map((message) => `${getFieldLabel(field)}: ${message}`),
        )
        .join(" · ")
    : "";

  return (
    [result?.message, fieldErrors].filter(Boolean).join(" · ") ||
    `No se pudo completar la operación${status ? ` (HTTP ${status})` : ""}.`
  );
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    code: "Código",
    year: "Año",
    period: "Período",
    startsAt: "Inicio",
    endsAt: "Fin",
    status: "Estado",
    subjectId: "Materia",
    professorId: "Profesor",
    sectionCode: "Sección",
    capacity: "Cupos",
    modality: "Modalidad",
    schedules: "Horarios",
  };

  return labels[field] ?? field;
}

function buildSectionFromDraft(
  id: string,
  draft: SectionDraft,
  responseSchedules: ApiScheduleResponse[] | undefined,
  previousSection: SectionItem | null,
  subjects: SubjectOption[],
  professors: ProfessorOption[],
  classrooms: ClassroomOption[],
): SectionItem {
  const subject = subjects.find((option) => option.id === draft.subjectId);
  const professor = professors.find((option) => option.id === draft.professorId);

  return {
    id,
    subjectId: draft.subjectId,
    professorId: draft.professorId || null,
    sectionCode: draft.sectionCode.trim().toUpperCase(),
    capacity: Number(draft.capacity),
    modality: draft.modality,
    status: draft.status,
    subject: {
      code: subject?.code ?? "N/D",
      name: subject?.name ?? "Materia sin nombre",
      departmentName: subject?.department.name ?? "Sin departamento",
    },
    professor: professor
      ? {
          employeeCode: professor.employeeCode,
          name: professor.user.name,
        }
      : null,
    schedules: draft.schedules.map((schedule, index) => {
      const responseSchedule = Array.isArray(responseSchedules)
        ? responseSchedules[index]
        : undefined;
      const classroom = classrooms.find(
        (option) => option.id === schedule.classroomId,
      );

      return {
        id: responseSchedule?.id ?? schedule.id,
        classroomId: schedule.classroomId || null,
        dayOfWeek: schedule.dayOfWeek,
        startMinute: timeToMinutes(schedule.startTime),
        endMinute: timeToMinutes(schedule.endTime),
        classroom: classroom
          ? {
              code: classroom.code,
              building: classroom.building,
              room: classroom.room,
            }
          : null,
      };
    }),
    enrollmentsCount: previousSection?.enrollmentsCount ?? 0,
    gradeItemsCount: previousSection?.gradeItemsCount ?? 0,
  };
}

function createEmptySectionDraft(): SectionDraft {
  return {
    subjectId: "",
    professorId: "",
    sectionCode: "",
    capacity: "",
    modality: "IN_PERSON",
    status: "PLANNED",
    schedules: [createEmptyScheduleDraft()],
  };
}

function createEmptyScheduleDraft(): ScheduleDraft {
  return {
    id: crypto.randomUUID(),
    classroomId: "",
    dayOfWeek: "MONDAY",
    startTime: "08:00",
    endTime: "10:00",
  };
}

function formatDisplayDate(date: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(
    2,
    "0",
  )}`;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

function formatClassroom(classroom: ClassroomOption) {
  return [
    classroom.code,
    classroom.building,
    classroom.room,
    classroom.capacity ? `(${classroom.capacity})` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function getDayLabel(value: DayOfWeekValue) {
  return daysOfWeek.find((day) => day.value === value)?.label ?? value;
}

const daysOfWeek: Array<{ value: DayOfWeekValue; label: string }> = [
  { value: "MONDAY", label: "Lunes" },
  { value: "TUESDAY", label: "Martes" },
  { value: "WEDNESDAY", label: "Miércoles" },
  { value: "THURSDAY", label: "Jueves" },
  { value: "FRIDAY", label: "Viernes" },
  { value: "SATURDAY", label: "Sábado" },
  { value: "SUNDAY", label: "Domingo" },
];

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";
