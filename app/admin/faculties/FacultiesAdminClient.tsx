"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Edit3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Faculty = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  _count?: {
    schools?: number;
    departments?: number;
    classrooms?: number;
  };
};

type ApiListResponse = {
  data: Faculty[];
  message?: string;
};

type ApiFacultyResponse = {
  data?: Faculty;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

type FormMode = "create" | "edit";

type FormState = {
  mode: FormMode;
  faculty: Faculty | null;
};

type DeleteState = {
  faculty: Faculty;
  isDeleting: boolean;
};

const emptyFormState: FormState = {
  mode: "create",
  faculty: null,
};

export function FacultiesAdminClient() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [query, setQuery] = useState("");
  const [formState, setFormState] = useState<FormState>(emptyFormState);
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadFaculties() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/faculties", {
        cache: "no-store",
        credentials: "include",
      });

      const result = (await response.json().catch(() => null)) as
        | ApiListResponse
        | null;

      if (!response.ok) {
        throw new Error(
          result?.message ?? `No se pudieron cargar las facultades.`,
        );
      }

      setFaculties(result?.data ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudieron cargar las facultades.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadFaculties();
    });
  }, []);

  const filteredFaculties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) return faculties;

    return faculties.filter((faculty) =>
      [faculty.name, faculty.code, faculty.description ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [faculties, query]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = buildFacultyPayload(formData);

    const editingFaculty =
      formState.mode === "edit" ? formState.faculty : null;
    const isEdit = editingFaculty !== null;
    const url = isEdit
      ? `/api/admin/faculties/${encodeURIComponent(editingFaculty.id)}`
      : "/api/admin/faculties";

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await readFacultyResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      form.reset();
      setFormState(emptyFormState);
      setSuccessMessage(
        result?.message ??
          (isEdit
            ? "Facultad actualizada correctamente."
            : "Facultad creada correctamente."),
      );
      await loadFaculties();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la facultad.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteState) return;

    const faculty = deleteState.faculty;

    setDeleteState({ faculty, isDeleting: true });
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/faculties/${encodeURIComponent(faculty.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      const result = await readFacultyResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      setDeleteState(null);
      setSuccessMessage(result?.message ?? "Facultad eliminada correctamente.");
      await loadFaculties();
    } catch (error) {
      setDeleteState({ faculty, isDeleting: false });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo eliminar la facultad.",
      );
    }
  }

  function startEdit(faculty: Faculty) {
    setFormState({
      mode: "edit",
      faculty,
    });
    setSuccessMessage("");
    setErrorMessage("");
  }

  function cancelEdit() {
    setFormState(emptyFormState);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
            Facultades
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Administra las facultades registradas en la universidad. Desde aquí
            puedes crear, editar y retirar facultades sin acceder directamente a
            la base de datos desde la interfaz.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadFaculties()}
          disabled={isLoading}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#031b46] shadow-sm transition hover:border-amber-300 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Actualizar
        </button>
      </section>

      {successMessage && (
        <Alert tone="success" message={successMessage} />
      )}

      {errorMessage && <Alert tone="error" message={errorMessage} />}

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <FacultyForm
          key={formState.faculty?.id ?? formState.mode}
          mode={formState.mode}
          faculty={formState.faculty}
          isSaving={isSaving}
          onSubmit={handleSubmit}
          onCancel={cancelEdit}
        />

        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#031b46]">
                Facultades registradas
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {faculties.length} facultades en el sistema.
              </p>
            </div>

            <div className="flex w-full items-center rounded-xl border border-slate-200 bg-white px-3 py-2 md:w-80">
              <Search className="mr-2 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar facultad..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingState />
          ) : filteredFaculties.length === 0 ? (
            <EmptyState hasQuery={query.trim().length > 0} />
          ) : (
            <FacultyTable
              faculties={filteredFaculties}
              onEdit={startEdit}
              onDelete={(faculty) =>
                setDeleteState({ faculty, isDeleting: false })
              }
            />
          )}
        </article>
      </section>

      {deleteState && (
        <DeleteConfirmation
          state={deleteState}
          onClose={() => setDeleteState(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </div>
  );
}

function FacultyForm({
  mode,
  faculty,
  isSaving,
  onSubmit,
  onCancel,
}: {
  mode: FormMode;
  faculty: Faculty | null;
  isSaving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const isEdit = mode === "edit";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <Building2 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#031b46]">
            {isEdit ? "Editar facultad" : "Crear facultad"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isEdit
              ? "Actualiza los datos institucionales de la facultad."
              : "Registra una nueva facultad académica."}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <FormField label="Código" htmlFor="faculty-code">
          <input
            id="faculty-code"
            name="code"
            type="text"
            required
            minLength={2}
            maxLength={20}
            defaultValue={faculty?.code ?? ""}
            placeholder="Ej: FING"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Nombre" htmlFor="faculty-name">
          <input
            id="faculty-name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={160}
            defaultValue={faculty?.name ?? ""}
            placeholder="Facultad de Ingeniería"
            className={inputClassName}
          />
        </FormField>

        <FormField label="Descripción" htmlFor="faculty-description">
          <textarea
            id="faculty-description"
            name="description"
            rows={5}
            defaultValue={faculty?.description ?? ""}
            placeholder="Descripción opcional"
            className={`${inputClassName} h-auto resize-none py-3`}
          />
        </FormField>

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Edit3 className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "Guardar cambios" : "Crear facultad"}
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          )}
        </div>
      </form>
    </article>
  );
}

function FacultyTable({
  faculties,
  onEdit,
  onDelete,
}: {
  faculties: Faculty[];
  onEdit: (faculty: Faculty) => void;
  onDelete: (faculty: Faculty) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-220 text-left">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-6 py-4 font-bold">Facultad</th>
            <th className="px-6 py-4 font-bold">Código</th>
            <th className="px-6 py-4 font-bold">Escuelas</th>
            <th className="px-6 py-4 font-bold">Departamentos</th>
            <th className="px-6 py-4 font-bold">Salones</th>
            <th className="px-6 py-4 text-right font-bold">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {faculties.map((faculty) => (
            <tr key={faculty.id} className="transition hover:bg-slate-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#031b46]/5 text-[#031b46]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800">{faculty.name}</p>
                    <p className="mt-1 line-clamp-1 max-w-xl text-xs text-slate-500">
                      {faculty.description ?? "Sin descripción registrada"}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  {faculty.code}
                </span>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                {faculty._count?.schools ?? 0}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                {faculty._count?.departments ?? 0}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                {faculty._count?.classrooms ?? 0}
              </td>
              <td className="px-6 py-4">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/faculties/${faculty.id}`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    aria-label={`Ver detalle de ${faculty.name}`}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => onEdit(faculty)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                    aria-label={`Editar ${faculty.name}`}
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(faculty)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Eliminar ${faculty.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeleteConfirmation({
  state,
  onClose,
  onConfirm,
}: {
  state: DeleteState;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#031b46]">
              Eliminar facultad
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta acción eliminará la facultad{" "}
              <span className="font-bold text-slate-800">
                {state.faculty.name}
              </span>
              . Si tiene escuelas, departamentos o salones asociados, el
              sistema rechazará la operación.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={state.isDeleting}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={state.isDeleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {state.isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-96 items-center justify-center gap-3 text-sm font-semibold text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
      Cargando facultades...
    </div>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="flex min-h-96 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500">
        <Building2 className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#031b46]">
        {hasQuery ? "Sin resultados" : "No hay facultades registradas"}
      </h3>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {hasQuery
          ? "Prueba con otro nombre, código o descripción."
          : "Crea la primera facultad usando el formulario."}
      </p>
    </div>
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

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-sm font-bold text-[#031b46]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

async function readFacultyResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");

    return {
      message: text.trim() || undefined,
    } satisfies ApiFacultyResponse;
  }

  return (await response.json().catch(() => null)) as ApiFacultyResponse | null;
}

function buildFacultyPayload(formData: FormData) {
  return {
    code: String(formData.get("code") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

function formatApiError(result: ApiFacultyResponse | null, status?: number) {
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
    name: "Nombre",
    description: "Descripción",
  };

  return labels[field] ?? field;
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";
