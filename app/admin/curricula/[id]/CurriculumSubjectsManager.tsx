"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Link2,
  Pencil,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";

type RequirementType = "REQUIRED" | "ELECTIVE";

type SubjectOption = {
  id: string;
  code: string;
  name: string;
  credits: number;
  hoursPerWeek: number | null;
  department: {
    name: string;
  };
};

type ElectiveGroupOption = {
  id: string;
  name: string;
  semesterNumber: number;
};

export type CurriculumSubjectItem = {
  id: string;
  subjectId: string;
  requirementType: RequirementType;
  semesterNumber: number;
  credits: number;
  minPassingGrade: string;
  electiveGroupId: string | null;
  electiveGroup: {
    name: string;
  } | null;
  subject: SubjectOption;
};

export type CurriculumPrerequisiteItem = {
  subjectId: string;
  prerequisiteId: string;
  subject: {
    code: string;
    name: string;
  };
  prerequisite: {
    code: string;
    name: string;
  };
};

type ApiResult<T = unknown> = {
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export function CurriculumSubjectsManager({
  curriculumId,
  subjects,
  availableSubjects,
  electiveGroups,
  prerequisites,
}: {
  curriculumId: string;
  subjects: CurriculumSubjectItem[];
  availableSubjects: SubjectOption[];
  electiveGroups: ElectiveGroupOption[];
  prerequisites: CurriculumPrerequisiteItem[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const subjectIdsInCurriculum = useMemo(
    () => new Set(subjects.map((item) => item.subjectId)),
    [subjects],
  );
  const subjectsToAdd = availableSubjects.filter(
    (subject) => !subjectIdsInCurriculum.has(subject.id),
  );
  const semesters = Array.from(
    new Set(subjects.map((item) => item.semesterNumber)),
  ).sort((a, b) => a - b);

  async function submitJson<T>(
    url: string,
    init: RequestInit,
    fallbackMessage: string,
  ) {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init.headers,
      },
      credentials: "include",
    });
    const result = (await response.json().catch(() => null)) as ApiResult<T> | null;

    if (!response.ok) {
      throw new Error(formatApiError(result, fallbackMessage));
    }

    setMessage(result?.message ?? fallbackMessage);
    router.refresh();
    return result?.data;
  }

  async function handleAddSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const subjectId = String(formData.get("subjectId") ?? "");
    const subject = availableSubjects.find((item) => item.id === subjectId);

    setBusyKey("add-subject");
    setMessage("");
    setError("");

    try {
      await submitJson(
        "/api/admin/curriculum-subjects",
        {
          method: "POST",
          body: JSON.stringify({
            curriculumId,
            subjectId,
            requirementType: formData.get("requirementType"),
            electiveGroupId: formData.get("electiveGroupId") || "",
            semesterNumber: formData.get("semesterNumber"),
            credits: formData.get("credits") || subject?.credits,
            minPassingGrade: formData.get("minPassingGrade") || 10,
          }),
        },
        "Materia agregada al pensum correctamente",
      );
      form.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo agregar la materia.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleUpdateSubject(
    event: FormEvent<HTMLFormElement>,
    curriculumSubjectId: string,
  ) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setBusyKey(`update-${curriculumSubjectId}`);
    setMessage("");
    setError("");

    try {
      await submitJson(
        `/api/admin/curriculum-subjects/${encodeURIComponent(
          curriculumSubjectId,
        )}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            requirementType: formData.get("requirementType"),
            electiveGroupId: formData.get("electiveGroupId") || "",
            semesterNumber: formData.get("semesterNumber"),
            credits: formData.get("credits"),
            minPassingGrade: formData.get("minPassingGrade"),
          }),
        },
        "Materia del pensum actualizada correctamente",
      );
      setEditingId(null);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo actualizar la materia.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeleteSubject(curriculumSubjectId: string) {
    setBusyKey(`delete-${curriculumSubjectId}`);
    setMessage("");
    setError("");

    try {
      await submitJson(
        `/api/admin/curriculum-subjects/${encodeURIComponent(
          curriculumSubjectId,
        )}`,
        { method: "DELETE" },
        "Materia eliminada del pensum correctamente",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo eliminar la materia.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleAddPrerequisite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setBusyKey("add-prerequisite");
    setMessage("");
    setError("");

    try {
      await submitJson(
        `/api/admin/curricula/${encodeURIComponent(
          curriculumId,
        )}/prerequisites`,
        {
          method: "POST",
          body: JSON.stringify({
            subjectId: formData.get("subjectId"),
            prerequisiteId: formData.get("prerequisiteId"),
          }),
        },
        "Prelacion agregada correctamente",
      );
      form.reset();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo agregar la prelacion.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function handleDeletePrerequisite(
    subjectId: string,
    prerequisiteId: string,
  ) {
    setBusyKey(`delete-prerequisite-${subjectId}-${prerequisiteId}`);
    setMessage("");
    setError("");

    try {
      await submitJson(
        `/api/admin/curricula/${encodeURIComponent(
          curriculumId,
        )}/prerequisites`,
        {
          method: "DELETE",
          body: JSON.stringify({ subjectId, prerequisiteId }),
        },
        "Prelacion eliminada correctamente",
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo eliminar la prelacion.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#031b46]">
          Materias del pensum
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Administra las materias, sus datos dentro del pensum y sus
          prelaciones.
        </p>
      </div>

      <form
        onSubmit={handleAddSubject}
        className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:grid-cols-6"
      >
        <Field label="Materia" className="xl:col-span-2">
          <select name="subjectId" required className={inputClass}>
            <option value="">Selecciona una materia</option>
            {subjectsToAdd.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.code} - {subject.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tipo">
          <select name="requirementType" defaultValue="REQUIRED" className={inputClass}>
            <option value="REQUIRED">Obligatoria</option>
            <option value="ELECTIVE">Electiva</option>
          </select>
        </Field>
        <Field label="Grupo electivo">
          <select name="electiveGroupId" className={inputClass}>
            <option value="">No aplica</option>
            {electiveGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Semestre">
          <input name="semesterNumber" type="number" min={1} required className={inputClass} />
        </Field>
        <Field label="Creditos">
          <input name="credits" type="number" min={1} required className={inputClass} />
        </Field>
        <Field label="Nota minima">
          <input
            name="minPassingGrade"
            type="number"
            min={0}
            max={20}
            step="0.01"
            defaultValue={10}
            className={inputClass}
          />
        </Field>
        <div className="flex items-end xl:col-span-6">
          <button
            type="submit"
            disabled={busyKey === "add-subject" || subjectsToAdd.length === 0}
            className={buttonClass}
          >
            {busyKey === "add-subject" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Agregar materia
          </button>
        </div>
      </form>

      {message && <p className="text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="text-sm font-semibold text-red-700">{error}</p>}

      {subjects.length === 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <h3 className="text-lg font-bold text-[#031b46]">
            Este pensum no tiene materias registradas
          </h3>
        </section>
      ) : (
        semesters.map((semester) => (
          <SemesterTable
            key={semester}
            semester={semester}
            subjects={subjects.filter((item) => item.semesterNumber === semester)}
            electiveGroups={electiveGroups}
            editingId={editingId}
            busyKey={busyKey}
            onEdit={setEditingId}
            onUpdate={handleUpdateSubject}
            onDelete={handleDeleteSubject}
          />
        ))
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-[#031b46]">
            <Link2 className="h-5 w-5 text-amber-500" />
            Prelaciones
          </h2>
        </div>
        <form
          onSubmit={handleAddPrerequisite}
          className="grid gap-4 border-b border-slate-100 p-6 md:grid-cols-3"
        >
          <Field label="Materia">
            <select name="subjectId" required className={inputClass}>
              <option value="">Materia que requiere prelacion</option>
              {subjects.map((item) => (
                <option key={item.subjectId} value={item.subjectId}>
                  {item.subject.code} - {item.subject.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Materia prelante">
            <select name="prerequisiteId" required className={inputClass}>
              <option value="">Materia requerida</option>
              {subjects.map((item) => (
                <option key={item.subjectId} value={item.subjectId}>
                  {item.subject.code} - {item.subject.name}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={busyKey === "add-prerequisite" || subjects.length < 2}
              className={buttonClass}
            >
              {busyKey === "add-prerequisite" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Agregar prelacion
            </button>
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-160 text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Materia</th>
                <th className="px-6 py-4 font-bold">Requiere</th>
                <th className="px-6 py-4 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {prerequisites.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-sm text-slate-500" colSpan={3}>
                    No hay prelaciones registradas para este pensum.
                  </td>
                </tr>
              ) : (
                prerequisites.map((item) => {
                  const deleteKey = `delete-prerequisite-${item.subjectId}-${item.prerequisiteId}`;

                  return (
                    <tr key={`${item.subjectId}-${item.prerequisiteId}`}>
                      <td className="px-6 py-4">
                        <SubjectLabel subject={item.subject} />
                      </td>
                      <td className="px-6 py-4">
                        <SubjectLabel subject={item.prerequisite} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePrerequisite(
                              item.subjectId,
                              item.prerequisiteId,
                            )
                          }
                          disabled={busyKey === deleteKey}
                          className={iconButtonClass}
                          aria-label="Eliminar prelacion"
                        >
                          {busyKey === deleteKey ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function SemesterTable({
  semester,
  subjects,
  electiveGroups,
  editingId,
  busyKey,
  onEdit,
  onUpdate,
  onDelete,
}: {
  semester: number;
  subjects: CurriculumSubjectItem[];
  electiveGroups: ElectiveGroupOption[];
  editingId: string | null;
  busyKey: string | null;
  onEdit: (id: string | null) => void;
  onUpdate: (
    event: FormEvent<HTMLFormElement>,
    curriculumSubjectId: string,
  ) => void;
  onDelete: (curriculumSubjectId: string) => void;
}) {
  const semesterCredits = subjects.reduce((total, item) => total + item.credits, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-[#031b46]">
            Semestre {semester}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {subjects.length} materias · {semesterCredits} creditos listados
          </p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-280 text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">Materia</th>
              <th className="px-6 py-4 font-bold">Departamento</th>
              <th className="px-6 py-4 font-bold">Tipo</th>
              <th className="px-6 py-4 font-bold">Grupo electivo</th>
              <th className="px-6 py-4 font-bold">Creditos</th>
              <th className="px-6 py-4 font-bold">Nota minima</th>
              <th className="px-6 py-4 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {subjects.map((item) =>
              editingId === item.id ? (
                <tr key={item.id}>
                  <td className="px-6 py-4" colSpan={7}>
                    <form
                      onSubmit={(event) => onUpdate(event, item.id)}
                      className="grid gap-3 md:grid-cols-6"
                    >
                      <div className="md:col-span-2">
                        <SubjectLabel subject={item.subject} />
                      </div>
                      <select
                        name="requirementType"
                        defaultValue={item.requirementType}
                        className={inputClass}
                      >
                        <option value="REQUIRED">Obligatoria</option>
                        <option value="ELECTIVE">Electiva</option>
                      </select>
                      <select
                        name="electiveGroupId"
                        defaultValue={item.electiveGroupId ?? ""}
                        className={inputClass}
                      >
                        <option value="">No aplica</option>
                        {electiveGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                      <input
                        name="semesterNumber"
                        type="number"
                        min={1}
                        defaultValue={item.semesterNumber}
                        className={inputClass}
                      />
                      <input
                        name="credits"
                        type="number"
                        min={1}
                        defaultValue={item.credits}
                        className={inputClass}
                      />
                      <input
                        name="minPassingGrade"
                        type="number"
                        min={0}
                        max={20}
                        step="0.01"
                        defaultValue={item.minPassingGrade}
                        className={inputClass}
                      />
                      <div className="flex gap-2 md:col-span-6">
                        <button
                          type="submit"
                          disabled={busyKey === `update-${item.id}`}
                          className={buttonClass}
                        >
                          {busyKey === `update-${item.id}` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => onEdit(null)}
                          className={secondaryButtonClass}
                        >
                          <X className="h-4 w-4" />
                          Cancelar
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <SubjectLabel subject={item.subject} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.subject.department.name}
                  </td>
                  <td className="px-6 py-4">
                    <RequirementPill requirementType={item.requirementType} />
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.electiveGroup?.name ?? "No aplica"}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                    {item.credits}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {item.minPassingGrade}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(item.id)}
                        className={iconButtonClass}
                        aria-label="Editar materia"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(item.id)}
                        disabled={busyKey === `delete-${item.id}`}
                        className={iconButtonClass}
                        aria-label="Eliminar materia"
                      >
                        {busyKey === `delete-${item.id}` ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SubjectLabel({
  subject,
}: {
  subject: { code: string; name: string };
}) {
  return (
    <div>
      <p className="font-bold text-slate-800">{subject.name}</p>
      <p className="mt-1 text-xs font-semibold text-amber-700">{subject.code}</p>
    </div>
  );
}

function RequirementPill({ requirementType }: { requirementType: RequirementType }) {
  const isRequired = requirementType === "REQUIRED";

  return (
    <span
      className={[
        "rounded-full px-3 py-1 text-xs font-bold",
        isRequired
          ? "bg-emerald-50 text-emerald-700"
          : "bg-blue-50 text-blue-700",
      ].join(" ")}
    >
      {isRequired ? "Obligatoria" : "Electiva"}
    </span>
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
      <span className="mb-2 block text-sm font-bold text-[#031b46]">{label}</span>
      {children}
    </label>
  );
}

function formatApiError(result: ApiResult | null, fallbackMessage: string) {
  if (!result) return fallbackMessage;
  if (result.errors) {
    const details = Object.values(result.errors).flat().filter(Boolean);
    if (details.length > 0) return details.join(". ");
  }
  return result.message ?? fallbackMessage;
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";

const buttonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70";

const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50";

const iconButtonClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-60";
