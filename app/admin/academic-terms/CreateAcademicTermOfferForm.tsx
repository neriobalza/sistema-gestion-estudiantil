"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";

type FacultyOption = {
  id: string;
  code: string;
  name: string;
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

type ScheduleDraft = {
  id: string;
  dayOfWeek: DayOfWeekValue;
  startTime: string;
  endTime: string;
  classroomId: string;
};

type OfferingDraft = {
  id: string;
  subjectId: string;
  professorId: string;
  sectionCode: string;
  capacity: string;
  modality: "IN_PERSON" | "ONLINE" | "HYBRID";
  schedules: ScheduleDraft[];
};

type DayOfWeekValue =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type ApiResponse = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export function CreateAcademicTermOfferForm({
  faculties,
  subjects,
  professors,
  classrooms,
}: {
  faculties: FacultyOption[];
  subjects: SubjectOption[];
  professors: ProfessorOption[];
  classrooms: ClassroomOption[];
}) {
  const router = useRouter();
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [offerings, setOfferings] = useState<OfferingDraft[]>([
    createEmptyOffering(),
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const filteredSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) => subject.department.facultyId === selectedFacultyId,
      ),
    [selectedFacultyId, subjects],
  );
  const filteredProfessors = useMemo(
    () =>
      professors.filter(
        (professor) => professor.department?.facultyId === selectedFacultyId,
      ),
    [selectedFacultyId, professors],
  );
  const filteredClassrooms = useMemo(
    () =>
      classrooms.filter((classroom) => classroom.facultyId === selectedFacultyId),
    [classrooms, selectedFacultyId],
  );

  function handleFacultyChange(facultyId: string) {
    setSelectedFacultyId(facultyId);
    setOfferings([createEmptyOffering()]);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function updateOffering(
    offeringId: string,
    field: keyof OfferingDraft,
    value: string,
  ) {
    setOfferings((currentOfferings) =>
      currentOfferings.map((offering) =>
        offering.id === offeringId ? { ...offering, [field]: value } : offering,
      ),
    );
  }

  function updateSchedule(
    offeringId: string,
    scheduleId: string,
    field: keyof ScheduleDraft,
    value: string,
  ) {
    setOfferings((currentOfferings) =>
      currentOfferings.map((offering) =>
        offering.id === offeringId
          ? {
              ...offering,
              schedules: offering.schedules.map((schedule) =>
                schedule.id === scheduleId
                  ? { ...schedule, [field]: value }
                  : schedule,
              ),
            }
          : offering,
      ),
    );
  }

  function addSchedule(offeringId: string) {
    setOfferings((currentOfferings) =>
      currentOfferings.map((offering) =>
        offering.id === offeringId
          ? {
              ...offering,
              schedules: [...offering.schedules, createEmptySchedule()],
            }
          : offering,
      ),
    );
  }

  function removeSchedule(offeringId: string, scheduleId: string) {
    setOfferings((currentOfferings) =>
      currentOfferings.map((offering) =>
        offering.id === offeringId
          ? {
              ...offering,
              schedules:
                offering.schedules.length === 1
                  ? [createEmptySchedule()]
                  : offering.schedules.filter(
                      (schedule) => schedule.id !== scheduleId,
                    ),
            }
          : offering,
      ),
    );
  }

  function addOffering() {
    setOfferings((currentOfferings) => [
      ...currentOfferings,
      createEmptyOffering(),
    ]);
  }

  function removeOffering(offeringId: string) {
    setOfferings((currentOfferings) =>
      currentOfferings.length === 1
        ? [createEmptyOffering()]
        : currentOfferings.filter((offering) => offering.id !== offeringId),
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      if (!selectedFacultyId) {
        throw new Error("Debes seleccionar una facultad.");
      }

      const payload = {
        code: formData.get("code"),
        year: formData.get("year"),
        period: formData.get("period"),
        startsAt: formData.get("startsAt"),
        endsAt: formData.get("endsAt"),
        status: formData.get("status"),
        facultyId: selectedFacultyId,
        enrollmentName: formData.get("enrollmentName"),
        enrollmentStartsAt: formData.get("enrollmentStartsAt"),
        enrollmentEndsAt: formData.get("enrollmentEndsAt"),
        offerings: offerings.map((offering) => ({
          subjectId: offering.subjectId,
          professorId: offering.professorId,
          sectionCode: offering.sectionCode,
          capacity: offering.capacity,
          modality: offering.modality,
          schedules: offering.schedules.map((schedule) => ({
            classroomId: schedule.classroomId,
            dayOfWeek: schedule.dayOfWeek,
            startMinute: timeToMinutes(schedule.startTime),
            endMinute: timeToMinutes(schedule.endTime),
          })),
        })),
      };

      const response = await fetch("/api/admin/academic-terms/with-offerings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      form.reset();
      setSelectedFacultyId("");
      setOfferings([createEmptyOffering()]);
      setSuccessMessage(
        result?.message ?? "Periodo academico y oferta creados correctamente.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo crear el periodo academico.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <CalendarDays className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#031b46]">
            Crear período con oferta académica
          </h2>
          <p className="mt-1 max-w-4xl text-sm text-slate-500">
            Registra el período para una facultad completa y carga cada materia
            ofertada con sección, profesor, salón, horario, modalidad y cupos.
          </p>
        </div>
      </div>

      {successMessage && <Alert tone="success" message={successMessage} />}
      {errorMessage && <Alert tone="error" message={errorMessage} />}

      <form onSubmit={handleSubmit} className="mt-5 space-y-6">
        <div className="grid gap-4 xl:grid-cols-6">
          <Field label="Código">
            <input
              name="code"
              required
              placeholder="2026-1"
              className={inputClassName}
            />
          </Field>
          <Field label="Año">
            <input
              name="year"
              type="number"
              min={1900}
              max={2200}
              required
              className={inputClassName}
            />
          </Field>
          <Field label="Período">
            <select name="period" required className={inputClassName}>
              <option value="FIRST">Primera mitad</option>
              <option value="SECOND">Segunda mitad</option>
              <option value="SUMMER">Verano</option>
            </select>
          </Field>
          <Field label="Inicio académico">
            <input
              name="startsAt"
              type="date"
              required
              className={inputClassName}
            />
          </Field>
          <Field label="Fin académico">
            <input
              name="endsAt"
              type="date"
              required
              className={inputClassName}
            />
          </Field>
          <Field label="Estado">
            <select
              name="status"
              defaultValue="PLANNED"
              className={inputClassName}
            >
              <option value="PLANNED">Planificado</option>
              <option value="ACTIVE">Activo</option>
              <option value="CLOSED">Cerrado</option>
            </select>
          </Field>
          <Field label="Facultad" className="xl:col-span-2">
            <select
              name="facultyId"
              required
              value={selectedFacultyId}
              onChange={(event) => handleFacultyChange(event.target.value)}
              className={inputClassName}
            >
              <option value="">Selecciona una facultad</option>
              {faculties.map((faculty) => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.code} - {faculty.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nombre de inscripción" className="xl:col-span-2">
            <input
              name="enrollmentName"
              placeholder="Inscripción 2026-1"
              className={inputClassName}
            />
          </Field>
          <Field label="Inicio inscripción">
            <input
              name="enrollmentStartsAt"
              type="date"
              required
              className={inputClassName}
            />
          </Field>
          <Field label="Fin inscripción">
            <input
              name="enrollmentEndsAt"
              type="date"
              required
              className={inputClassName}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-5 md:flex-row md:items-center">
            <div>
              <h3 className="text-base font-bold text-[#031b46]">
                Materias ofertadas
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Agrega cada sección ofertada para la facultad seleccionada.
              </p>
            </div>
            <button
              type="button"
              onClick={addOffering}
              disabled={isSaving || !selectedFacultyId}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-[#031b46] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <Plus className="h-4 w-4" />
              Agregar materia
            </button>
          </div>

          {!selectedFacultyId && (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
              Selecciona una facultad para cargar materias, profesores y
              salones disponibles.
            </p>
          )}

          {offerings.map((offering, index) => (
            <OfferingCard
              key={offering.id}
              index={index}
              offering={offering}
              subjects={filteredSubjects}
              professors={filteredProfessors}
              classrooms={filteredClassrooms}
              disabled={isSaving || !selectedFacultyId}
              onChange={updateOffering}
              onScheduleChange={updateSchedule}
              onAddSchedule={addSchedule}
              onRemoveSchedule={removeSchedule}
              onRemove={removeOffering}
            />
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-5 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70 md:w-auto"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Crear período y oferta
          </button>
        </div>
      </form>
    </section>
  );
}

function OfferingCard({
  index,
  offering,
  subjects,
  professors,
  classrooms,
  disabled,
  onChange,
  onScheduleChange,
  onAddSchedule,
  onRemoveSchedule,
  onRemove,
}: {
  index: number;
  offering: OfferingDraft;
  subjects: SubjectOption[];
  professors: ProfessorOption[];
  classrooms: ClassroomOption[];
  disabled: boolean;
  onChange: (offeringId: string, field: keyof OfferingDraft, value: string) => void;
  onScheduleChange: (
    offeringId: string,
    scheduleId: string,
    field: keyof ScheduleDraft,
    value: string,
  ) => void;
  onAddSchedule: (offeringId: string) => void;
  onRemoveSchedule: (offeringId: string, scheduleId: string) => void;
  onRemove: (offeringId: string) => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="text-sm font-bold text-[#031b46]">
          Materia ofertada {index + 1}
        </h4>
        <button
          type="button"
          onClick={() => onRemove(offering.id)}
          disabled={disabled}
          title="Quitar materia ofertada"
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-8">
        <Field label="Materia" className="xl:col-span-2">
          <select
            required
            value={offering.subjectId}
            onChange={(event) =>
              onChange(offering.id, "subjectId", event.target.value)
            }
            disabled={disabled}
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
            value={offering.sectionCode}
            onChange={(event) =>
              onChange(offering.id, "sectionCode", event.target.value)
            }
            disabled={disabled}
            placeholder="A"
            className={inputClassName}
          />
        </Field>
        <Field label="Profesor" className="xl:col-span-2">
          <select
            value={offering.professorId}
            onChange={(event) =>
              onChange(offering.id, "professorId", event.target.value)
            }
            disabled={disabled}
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
            value={offering.modality}
            onChange={(event) =>
              onChange(offering.id, "modality", event.target.value)
            }
            disabled={disabled}
            className={inputClassName}
          >
            <option value="IN_PERSON">Presencial</option>
            <option value="ONLINE">En línea</option>
            <option value="HYBRID">Híbrida</option>
          </select>
        </Field>
        <Field label="Cupos">
          <input
            required
            type="number"
            min={1}
            value={offering.capacity}
            onChange={(event) =>
              onChange(offering.id, "capacity", event.target.value)
            }
            disabled={disabled}
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <h5 className="text-sm font-bold text-[#031b46]">Horarios</h5>
          <button
            type="button"
            onClick={() => onAddSchedule(offering.id)}
            disabled={disabled}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#031b46] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Plus className="h-4 w-4" />
            Agregar día
          </button>
        </div>

        {offering.schedules.map((schedule, scheduleIndex) => (
          <div
            key={schedule.id}
            className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 xl:grid-cols-8"
          >
            <Field label={`Día ${scheduleIndex + 1}`} className="xl:col-span-2">
              <select
                value={schedule.dayOfWeek}
                onChange={(event) =>
                  onScheduleChange(
                    offering.id,
                    schedule.id,
                    "dayOfWeek",
                    event.target.value,
                  )
                }
                disabled={disabled}
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
                  onScheduleChange(
                    offering.id,
                    schedule.id,
                    "classroomId",
                    event.target.value,
                  )
                }
                disabled={disabled}
                className={inputClassName}
              >
                <option value="">Selecciona salón</option>
                {classrooms.map((classroom) => (
                  <option key={classroom.id} value={classroom.id}>
                    {classroom.code}
                    {classroom.building ? ` - ${classroom.building}` : ""}
                    {classroom.room ? ` ${classroom.room}` : ""}
                    {classroom.capacity ? ` (${classroom.capacity})` : ""}
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
                  onScheduleChange(
                    offering.id,
                    schedule.id,
                    "startTime",
                    event.target.value,
                  )
                }
                disabled={disabled}
                className={inputClassName}
              />
            </Field>
            <Field label="Fin">
              <input
                required
                type="time"
                value={schedule.endTime}
                onChange={(event) =>
                  onScheduleChange(
                    offering.id,
                    schedule.id,
                    "endTime",
                    event.target.value,
                  )
                }
                disabled={disabled}
                className={inputClassName}
              />
            </Field>
            <div className="flex items-end xl:col-span-2">
              <button
                type="button"
                onClick={() => onRemoveSchedule(offering.id, schedule.id)}
                disabled={disabled}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                Quitar horario
              </button>
            </div>
          </div>
        ))}
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
      className={`mb-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
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
    startsAt: "Inicio académico",
    endsAt: "Fin académico",
    facultyId: "Facultad",
    enrollmentStartsAt: "Inicio inscripción",
    enrollmentEndsAt: "Fin inscripción",
    offerings: "Materias ofertadas",
  };

  return labels[field] ?? field;
}

function createEmptyOffering(): OfferingDraft {
  return {
    id: crypto.randomUUID(),
    subjectId: "",
    professorId: "",
    sectionCode: "",
    capacity: "",
    modality: "IN_PERSON",
    schedules: [createEmptySchedule()],
  };
}

function createEmptySchedule(): ScheduleDraft {
  return {
    id: crypto.randomUUID(),
    dayOfWeek: "MONDAY",
    startTime: "08:00",
    endTime: "10:00",
    classroomId: "",
  };
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
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
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
