"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  DoorOpen,
  Edit3,
  GraduationCap,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Trash2,
  X,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Faculty = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type CountBag = Record<string, number | undefined>;

type School = {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  description: string | null;
  _count?: CountBag;
};

type Department = {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  description: string | null;
  _count?: CountBag;
};

type Classroom = {
  id: string;
  facultyId: string;
  code: string;
  building: string | null;
  room: string | null;
  capacity: number | null;
  _count?: CountBag;
};

type ResourceKind = "school" | "department" | "classroom";

type ResourceItem = School | Department | Classroom;

type ApiResponse<T> = {
  data?: T;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

type FormState = {
  kind: ResourceKind;
  item: ResourceItem | null;
};

type DeleteState = {
  kind: ResourceKind;
  item: ResourceItem;
  isDeleting: boolean;
};

type ResourceConfig = {
  title: string;
  singular: string;
  endpoint: string;
  icon: typeof Building2;
};

const configs: Record<ResourceKind, ResourceConfig> = {
  school: {
    title: "Escuelas",
    singular: "escuela",
    endpoint: "/api/admin/schools",
    icon: GraduationCap,
  },
  department: {
    title: "Departamentos",
    singular: "departamento",
    endpoint: "/api/admin/departments",
    icon: Layers3,
  },
  classroom: {
    title: "Salones",
    singular: "salon",
    endpoint: "/api/admin/classrooms",
    icon: DoorOpen,
  },
};

export function FacultyDetailClient({ facultyId }: { facultyId: string }) {
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [formState, setFormState] = useState<FormState>({
    kind: "school",
    item: null,
  });
  const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const encodedFacultyId = encodeURIComponent(facultyId);
      const [
        facultyResponse,
        schoolsResponse,
        departmentsResponse,
        classroomsResponse,
      ] = await Promise.all([
        fetch(`/api/admin/faculties/${encodedFacultyId}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/admin/schools?facultyId=${encodedFacultyId}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/admin/departments?facultyId=${encodedFacultyId}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/admin/classrooms?facultyId=${encodedFacultyId}`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      const facultyJson = await readApiResponse<Faculty>(facultyResponse);
      const schoolsJson = await readApiResponse<School[]>(schoolsResponse);
      const departmentsJson =
        await readApiResponse<Department[]>(departmentsResponse);
      const classroomsJson =
        await readApiResponse<Classroom[]>(classroomsResponse);

      if (!facultyResponse.ok) throw new Error(formatApiError(facultyJson));
      if (!schoolsResponse.ok) throw new Error(formatApiError(schoolsJson));
      if (!departmentsResponse.ok) {
        throw new Error(formatApiError(departmentsJson));
      }
      if (!classroomsResponse.ok) {
        throw new Error(formatApiError(classroomsJson));
      }

      setFaculty(facultyJson?.data ?? null);
      setSchools(schoolsJson?.data ?? []);
      setDepartments(departmentsJson?.data ?? []);
      setClassrooms(classroomsJson?.data ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar la informacion de la facultad.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [facultyId]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const activeConfig = configs[formState.kind];

  const totals = useMemo(
    () => ({
      school: schools.length,
      department: departments.length,
      classroom: classrooms.length,
    }),
    [schools.length, departments.length, classrooms.length],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const payload = buildPayload(formState.kind, facultyId, formData);
    const resourceId = formState.item?.id;
    const url = resourceId
      ? `${activeConfig.endpoint}/${encodeURIComponent(resourceId)}`
      : activeConfig.endpoint;

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(url, {
        method: resourceId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse<ResourceItem>(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      setFormState({ kind: formState.kind, item: null });
      setSuccessMessage(
        result?.message ??
          `${capitalize(activeConfig.singular)} ${
            resourceId ? "actualizado" : "creado"
          } correctamente.`,
      );
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `No se pudo guardar el ${activeConfig.singular}.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteState) return;

    const currentDelete = deleteState;
    const config = configs[currentDelete.kind];

    setDeleteState({ ...currentDelete, isDeleting: true });
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `${config.endpoint}/${encodeURIComponent(currentDelete.item.id)}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const result = await readApiResponse<ResourceItem>(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      setDeleteState(null);
      setSuccessMessage(
        result?.message ??
          `${capitalize(config.singular)} eliminado correctamente.`,
      );
      await loadData();
    } catch (error) {
      setDeleteState({ ...currentDelete, isDeleting: false });
      setErrorMessage(
        error instanceof Error
          ? error.message
          : `No se pudo eliminar el ${config.singular}.`,
      );
    }
  }

  function startCreate(kind: ResourceKind) {
    setFormState({ kind, item: null });
    setSuccessMessage("");
    setErrorMessage("");
  }

  function startEdit(kind: ResourceKind, item: ResourceItem) {
    setFormState({ kind, item });
    setSuccessMessage("");
    setErrorMessage("");
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/faculties"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#031b46]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a facultades
      </Link>

      <section className="relative overflow-hidden rounded-2xl bg-[#031b46] p-8 text-white shadow-sm">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-amber-400" />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-400">
              <Building2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-amber-300">
                {faculty?.code ?? "Facultad"}
              </p>
              <h1 className="mt-1 text-2xl font-bold md:text-3xl">
                {faculty?.name ?? "Cargando facultad..."}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                {faculty?.description ??
                  "Gestiona escuelas, departamentos y salones."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadData()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Actualizar
          </button>
        </div>
      </section>

      {successMessage && <Alert tone="success" message={successMessage} />}
      {errorMessage && <Alert tone="error" message={errorMessage} />}

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Escuelas"
          value={totals.school}
          icon={GraduationCap}
        />
        <SummaryCard
          label="Departamentos"
          value={totals.department}
          icon={Layers3}
        />
        <SummaryCard label="Salones" value={totals.classroom} icon={DoorOpen} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <ResourceForm
          key={`${formState.kind}-${formState.item?.id ?? "new"}`}
          kind={formState.kind}
          item={formState.item}
          isSaving={isSaving}
          onKindChange={startCreate}
          onSubmit={handleSubmit}
          onCancel={() => setFormState({ kind: formState.kind, item: null })}
        />

        <div className="space-y-6">
          {isLoading ? (
            <LoadingState />
          ) : (
            <>
              <ResourceSection
                kind="school"
                items={schools}
                emptyLabel="Esta facultad no tiene escuelas registradas."
                onCreate={startCreate}
                onEdit={startEdit}
                onDelete={(kind, item) =>
                  setDeleteState({ kind, item, isDeleting: false })
                }
              />
              <ResourceSection
                kind="department"
                items={departments}
                emptyLabel="Esta facultad no tiene departamentos registrados."
                onCreate={startCreate}
                onEdit={startEdit}
                onDelete={(kind, item) =>
                  setDeleteState({ kind, item, isDeleting: false })
                }
              />
              <ResourceSection
                kind="classroom"
                items={classrooms}
                emptyLabel="Esta facultad no tiene salones registrados."
                onCreate={startCreate}
                onEdit={startEdit}
                onDelete={(kind, item) =>
                  setDeleteState({ kind, item, isDeleting: false })
                }
              />
            </>
          )}
        </div>
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

function ResourceForm({
  kind,
  item,
  isSaving,
  onKindChange,
  onSubmit,
  onCancel,
}: {
  kind: ResourceKind;
  item: ResourceItem | null;
  isSaving: boolean;
  onKindChange: (kind: ResourceKind) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const config = configs[kind];
  const Icon = config.icon;
  const isClassroom = kind === "classroom";
  const classroom = isClassroom ? (item as Classroom | null) : null;
  const namedItem = !isClassroom ? (item as School | Department | null) : null;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm h-fit">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#031b46]">
            {item ? `Editar ${config.singular}` : `Crear ${config.singular}`}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Gestiona los datos asociados a esta facultad.
          </p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-3 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {typedResourceKinds.map((resourceKind) => {
          const resourceConfig = configs[resourceKind];

          return (
            <button
              key={resourceKind}
              type="button"
              onClick={() => onKindChange(resourceKind)}
              disabled={isSaving}
              className={[
                "rounded-lg px-2 py-2 text-xs font-bold transition",
                kind === resourceKind
                  ? "bg-[#031b46] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white",
              ].join(" ")}
            >
              {resourceConfig.title}
            </button>
          );
        })}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <FormField label="Código" htmlFor="resource-code">
          <input
            id="resource-code"
            name="code"
            required
            minLength={2}
            maxLength={20}
            defaultValue={item?.code ?? ""}
            placeholder={isClassroom ? "A-101" : "EBAS"}
            className={inputClassName}
          />
        </FormField>

        {!isClassroom && (
          <>
            <FormField label="Nombre" htmlFor="resource-name">
              <input
                id="resource-name"
                name="name"
                required
                minLength={2}
                maxLength={160}
                defaultValue={namedItem?.name ?? ""}
                placeholder="Nombre"
                className={inputClassName}
              />
            </FormField>
            <FormField label="Descripción" htmlFor="resource-description">
              <textarea
                id="resource-description"
                name="description"
                rows={4}
                defaultValue={namedItem?.description ?? ""}
                placeholder="Descripción opcional"
                className={`${inputClassName} h-auto resize-none py-3`}
              />
            </FormField>
          </>
        )}

        {isClassroom && (
          <>
            <FormField label="Edificio" htmlFor="classroom-building">
              <input
                id="classroom-building"
                name="building"
                defaultValue={classroom?.building ?? ""}
                placeholder="Edificio A"
                className={inputClassName}
              />
            </FormField>
            <FormField label="Aula" htmlFor="classroom-room">
              <input
                id="classroom-room"
                name="room"
                defaultValue={classroom?.room ?? ""}
                placeholder="101"
                className={inputClassName}
              />
            </FormField>
            <FormField label="Capacidad" htmlFor="classroom-capacity">
              <input
                id="classroom-capacity"
                name="capacity"
                type="number"
                min={1}
                defaultValue={classroom?.capacity ?? ""}
                placeholder="40"
                className={inputClassName}
              />
            </FormField>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : item ? (
              <Edit3 className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {item ? "Guardar cambios" : "Crear"}
          </button>

          {item && (
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

function ResourceSection<T extends ResourceItem>({
  kind,
  items,
  emptyLabel,
  onCreate,
  onEdit,
  onDelete,
}: {
  kind: ResourceKind;
  items: T[];
  emptyLabel: string;
  onCreate: (kind: ResourceKind) => void;
  onEdit: (kind: ResourceKind, item: T) => void;
  onDelete: (kind: ResourceKind, item: T) => void;
}) {
  const config = configs[kind];
  const Icon = config.icon;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#031b46]/5 text-[#031b46]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#031b46]">{config.title}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {items.length} registros
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onCreate(kind)}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f]"
        >
          <Plus className="h-4 w-4" />
          Crear
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-36 items-center justify-center p-8 text-center text-sm font-medium text-slate-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-180 text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Código</th>
                <th className="px-6 py-4 font-bold">
                  {kind === "classroom" ? "Ubicación" : "Nombre"}
                </th>
                <th className="px-6 py-4 font-bold">Detalle</th>
                <th className="px-6 py-4 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-800">
                    {getPrimaryLabel(kind, item)}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {getSecondaryLabel(kind, item)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      {kind !== "classroom" && (
                        <Link
                          href={getDetailHref(kind, item)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                          aria-label={`Ver detalle de ${item.code}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(kind, item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                        aria-label={`Editar ${item.code}`}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(kind, item)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Eliminar ${item.code}`}
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
      )}
    </section>
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
  const config = configs[state.kind];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#031b46]">
              Eliminar {config.singular}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Esta acción eliminará el registro{" "}
              <span className="font-bold text-slate-800">
                {getPrimaryLabel(state.kind, state.item)}
              </span>
              . Si tiene datos académicos asociados, la API rechazará la
              operación.
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

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#031b46]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#031b46]">{value}</p>
        </div>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-96 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
      Cargando datos de la facultad...
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

async function readApiResponse<T>(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");

    return {
      message: text.trim() || undefined,
    } as ApiResponse<T>;
  }

  return (await response.json().catch(() => null)) as ApiResponse<T> | null;
}

function formatApiError(result: ApiResponse<unknown> | null, status?: number) {
  const fieldErrors = result?.errors
    ? Object.entries(result.errors)
        .flatMap(([field, messages]) =>
          (messages ?? []).map(
            (message) => `${getFieldLabel(field)}: ${message}`,
          ),
        )
        .join(" · ")
    : "";

  return (
    [result?.message, fieldErrors].filter(Boolean).join(" · ") ||
    `No se pudo completar la operación${status ? ` (HTTP ${status})` : ""}.`
  );
}

function buildPayload(
  kind: ResourceKind,
  facultyId: string,
  formData: FormData,
) {
  const base = {
    facultyId,
    code: String(formData.get("code") ?? "").trim(),
  };

  if (kind === "classroom") {
    const capacity = String(formData.get("capacity") ?? "").trim();

    return {
      ...base,
      building: String(formData.get("building") ?? "").trim(),
      room: String(formData.get("room") ?? "").trim(),
      ...(capacity ? { capacity: Number(capacity) } : {}),
    };
  }

  return {
    ...base,
    name: String(formData.get("name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
  };
}

function getPrimaryLabel(kind: ResourceKind, item: ResourceItem) {
  if (kind === "classroom") {
    const classroom = item as Classroom;

    return (
      [classroom.building, classroom.room].filter(Boolean).join(" / ") ||
      classroom.code
    );
  }

  return (item as School | Department).name;
}

function getSecondaryLabel(kind: ResourceKind, item: ResourceItem) {
  if (kind === "school") {
    return `${item._count?.careers ?? 0} carreras · ${
      item._count?.enrollmentPeriods ?? 0
    } periodos`;
  }

  if (kind === "department") {
    return `${item._count?.subjects ?? 0} materias · ${
      item._count?.professors ?? 0
    } profesores`;
  }

  const classroom = item as Classroom;

  return `${classroom.capacity ?? "Sin"} capacidad · ${
    classroom._count?.schedules ?? 0
  } horarios`;
}

function getDetailHref(kind: ResourceKind, item: ResourceItem) {
  if (kind === "school") {
    return `/admin/schools/${item.id}`;
  }

  if (kind === "department") {
    return `/admin/departments/${item.id}`;
  }

  return "#";
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    code: "Código",
    name: "Nombre",
    description: "Descripción",
    building: "Edificio",
    room: "Aula",
    capacity: "Capacidad",
    facultyId: "Facultad",
  };

  return labels[field] ?? field;
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const typedResourceKinds: ResourceKind[] = [
  "school",
  "department",
  "classroom",
];

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";
