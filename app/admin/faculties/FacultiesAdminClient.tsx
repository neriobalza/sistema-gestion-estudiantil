"use client";

import {
  ArrowUpRight,
  Building2,
  DoorOpen,
  GraduationCap,
  Layers3,
  Loader2,
  Plus,
  RefreshCcw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type CountBag = Record<string, number>;

type Faculty = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  _count?: CountBag;
};

type School = {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  description: string | null;
  faculty?: Faculty;
  _count?: CountBag;
};

type Department = {
  id: string;
  facultyId: string;
  code: string;
  name: string;
  description: string | null;
  faculty?: Faculty;
  _count?: CountBag;
};

type Classroom = {
  id: string;
  facultyId: string;
  code: string;
  building: string | null;
  room: string | null;
  capacity: number | null;
  faculty?: Faculty;
  _count?: CountBag;
};

type ApiList<T> = {
  data: T[];
  message?: string;
};

type ModalKind = "faculty" | "school" | "department" | "classroom";

const modalLabels: Record<ModalKind, string> = {
  faculty: "Nueva facultad",
  school: "Nueva escuela",
  department: "Nuevo departamento",
  classroom: "Nuevo salon",
};

const endpoints: Record<ModalKind, string> = {
  faculty: "/api/admin/faculties",
  school: "/api/admin/schools",
  department: "/api/admin/departments",
  classroom: "/api/admin/classrooms",
};

export function FacultiesAdminClient() {
  const searchParams = useSearchParams();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [query, setQuery] = useState("");
  const [modalKind, setModalKind] = useState<ModalKind | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setIsLoading(true);
    setError("");

    try {
      const resources = [
        ["facultades", "/api/admin/faculties"],
        ["escuelas", "/api/admin/schools"],
        ["departamentos", "/api/admin/departments"],
        ["salones", "/api/admin/classrooms"],
      ] as const;

      const responses = await Promise.all(
        resources.map(async ([label, url]) => {
          const response = await fetch(url, {
            cache: "no-store",
            credentials: "include",
          });
          console.log(response);

          if (!response.ok) {
            const body = (await response.json().catch(() => null)) as {
              message?: string;
            } | null;

            throw new Error(
              `No se pudo cargar ${label}: ${
                body?.message ?? `HTTP ${response.status}`
              }`,
            );
          }

          return response.json();
        }),
      );

      const [facultiesJson, schoolsJson, departmentsJson, classroomsJson] =
        responses as [
          ApiList<Faculty>,
          ApiList<School>,
          ApiList<Department>,
          ApiList<Classroom>,
        ];

      setFaculties(facultiesJson.data);
      setSchools(schoolsJson.data);
      setDepartments(departmentsJson.data);
      setClassrooms(classroomsJson.data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la informacion academica.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, []);

  useEffect(() => {
    const createParam = searchParams.get("create");

    if (isModalKind(createParam)) {
      queueMicrotask(() => {
        setModalKind(createParam);
      });
    }
  }, [searchParams]);

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

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modalKind) return;

    const formData = new FormData(event.currentTarget);
    const payload = getPayload(modalKind, formData);

    setIsSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(endpoints[modalKind], {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message ?? "No se pudo crear el registro.");
      }

      setMessage(result.message ?? "Registro creado correctamente.");
      setModalKind(null);
      await loadData();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el registro.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
            Facultades
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Gestiona la estructura física y académica base: facultades,
            escuelas, departamentos y salones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#031b46] shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
        >
          <RefreshCcw className="h-4 w-4" />
          Actualizar
        </button>
      </section>

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Facultades"
          value={faculties.length}
          icon={Building2}
          onCreate={() => setModalKind("faculty")}
        />
        <StatCard
          label="Escuelas"
          value={schools.length}
          icon={GraduationCap}
          onCreate={() => setModalKind("school")}
          disabled={!faculties.length}
        />
        <StatCard
          label="Departamentos"
          value={departments.length}
          icon={Layers3}
          onCreate={() => setModalKind("department")}
          disabled={!faculties.length}
        />
        <StatCard
          label="Salones"
          value={classrooms.length}
          icon={DoorOpen}
          onCreate={() => setModalKind("classroom")}
          disabled={!faculties.length}
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#031b46]">
              Facultades registradas
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Vista general con conteos de escuelas, departamentos y salones.
            </p>
          </div>

          <div className="flex w-full items-center rounded-xl border border-slate-200 bg-white px-3 py-2 md:w-80">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
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
          <EmptyState onCreate={() => setModalKind("faculty")} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-195 text-left">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold">Facultad</th>
                  <th className="px-6 py-4 font-bold">Codigo</th>
                  <th className="px-6 py-4 font-bold">Escuelas</th>
                  <th className="px-6 py-4 font-bold">Departamentos</th>
                  <th className="px-6 py-4 font-bold">Salones</th>
                  <th className="px-6 py-4 text-right font-bold">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFaculties.map((faculty) => (
                  <tr key={faculty.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#031b46]/5 text-[#031b46]">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">
                            {faculty.name}
                          </p>
                          <p className="mt-1 line-clamp-1 max-w-xl text-xs text-slate-500">
                            {faculty.description ??
                              "Sin descripcion registrada"}
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
                      {faculty._count?.schools ??
                        countByFaculty(schools, faculty.id)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {faculty._count?.departments ??
                        countByFaculty(departments, faculty.id)}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                      {faculty._count?.classrooms ??
                        countByFaculty(classrooms, faculty.id)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/faculties/${faculty.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600"
                        aria-label={`Ver detalle de ${faculty.name}`}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <RelatedList
          title="Escuelas"
          emptyLabel="No hay escuelas registradas"
          items={schools}
          icon={GraduationCap}
          getMeta={(item) => item.faculty?.name ?? "Sin facultad"}
          onCreate={() => setModalKind("school")}
          disabled={!faculties.length}
        />
        <RelatedList
          title="Departamentos"
          emptyLabel="No hay departamentos registrados"
          items={departments}
          icon={Layers3}
          getMeta={(item) => item.faculty?.name ?? "Sin facultad"}
          onCreate={() => setModalKind("department")}
          disabled={!faculties.length}
        />
        <RelatedList
          title="Salones"
          emptyLabel="No hay salones registrados"
          items={classrooms}
          icon={DoorOpen}
          getMeta={(item) =>
            [item.faculty?.name, item.building, item.room]
              .filter(Boolean)
              .join(" / ") || "Sin ubicacion"
          }
          onCreate={() => setModalKind("classroom")}
          disabled={!faculties.length}
        />
      </section>

      {modalKind && (
        <CreateModal
          kind={modalKind}
          faculties={faculties}
          isSaving={isSaving}
          onClose={() => setModalKind(null)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  onCreate,
  disabled = false,
}: {
  label: string;
  value: number;
  icon: typeof Building2;
  onCreate: () => void;
  disabled?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#031b46]">{label}</p>
            <p className="mt-1 text-3xl font-bold text-[#031b46]">{value}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreate}
          disabled={disabled}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#031b46] text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
          aria-label={`Crear ${label.toLowerCase()}`}
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-80 items-center justify-center gap-3 text-sm font-semibold text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
      Cargando estructura academica...
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500">
        <Building2 className="h-8 w-8" />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#031b46]">
        No hay facultades registradas
      </h3>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f]"
      >
        <Plus className="h-4 w-4" />
        Crear facultad
      </button>
    </div>
  );
}

function RelatedList<T extends { id: string; code: string; name?: string }>({
  title,
  emptyLabel,
  items,
  icon: Icon,
  getMeta,
  onCreate,
  disabled,
}: {
  title: string;
  emptyLabel: string;
  items: T[];
  icon: typeof Building2;
  getMeta: (item: T) => string;
  onCreate: () => void;
  disabled: boolean;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 p-5">
        <h3 className="text-lg font-bold text-[#031b46]">{title}</h3>
        <button
          type="button"
          onClick={onCreate}
          disabled={disabled}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={`Crear ${title.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center text-sm text-slate-500">
          <Icon className="mb-3 h-8 w-8 text-slate-300" />
          {emptyLabel}
        </div>
      ) : (
        <div className="max-h-96 divide-y divide-slate-100 overflow-auto">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#031b46]/5 text-[#031b46]">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-800">
                  {item.name ?? item.code}
                </p>
                <p className="mt-1 truncate text-xs text-slate-500">
                  {item.code} · {getMeta(item)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function CreateModal({
  kind,
  faculties,
  isSaving,
  onClose,
  onSubmit,
}: {
  kind: ModalKind;
  faculties: Faculty[];
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const needsFaculty = kind !== "faculty";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#031b46]">
              {modalLabels[kind]}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Completa los datos requeridos para registrar el elemento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 px-6 py-6">
          {needsFaculty && (
            <FormField label="Facultad" htmlFor="facultyId">
              <select
                id="facultyId"
                name="facultyId"
                required
                className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
              >
                <option value="">Selecciona una facultad</option>
                {faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Codigo" htmlFor="code">
              <input
                id="code"
                name="code"
                type="text"
                required
                placeholder={kind === "classroom" ? "Ej: A-101" : "Ej: FING"}
                className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
              />
            </FormField>

            {kind !== "classroom" ? (
              <FormField label="Nombre" htmlFor="name">
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Nombre"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
                />
              </FormField>
            ) : (
              <FormField label="Capacidad" htmlFor="capacity">
                <input
                  id="capacity"
                  name="capacity"
                  type="number"
                  min={1}
                  placeholder="Ej: 40"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
                />
              </FormField>
            )}
          </div>

          {kind === "classroom" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Edificio" htmlFor="building">
                <input
                  id="building"
                  name="building"
                  type="text"
                  placeholder="Ej: Edificio A"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
                />
              </FormField>
              <FormField label="Aula" htmlFor="room">
                <input
                  id="room"
                  name="room"
                  type="text"
                  placeholder="Ej: 101"
                  className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
                />
              </FormField>
            </div>
          ) : (
            <FormField label="Descripcion" htmlFor="description">
              <textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Descripcion opcional"
                className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
              />
            </FormField>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 px-5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#031b46] px-5 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Guardar
            </button>
          </div>
        </form>
      </div>
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

function getPayload(kind: ModalKind, formData: FormData) {
  const base = {
    code: String(formData.get("code") ?? ""),
  };

  if (kind === "faculty") {
    return {
      ...base,
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
    };
  }

  if (kind === "classroom") {
    const capacity = String(formData.get("capacity") ?? "").trim();

    return {
      ...base,
      facultyId: String(formData.get("facultyId") ?? ""),
      building: String(formData.get("building") ?? ""),
      room: String(formData.get("room") ?? ""),
      ...(capacity ? { capacity: Number(capacity) } : {}),
    };
  }

  return {
    ...base,
    facultyId: String(formData.get("facultyId") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
  };
}

function countByFaculty<T extends { facultyId: string }>(
  items: T[],
  facultyId: string,
) {
  return items.filter((item) => item.facultyId === facultyId).length;
}

function isModalKind(value: string | null): value is ModalKind {
  return (
    value === "faculty" ||
    value === "school" ||
    value === "department" ||
    value === "classroom"
  );
}
