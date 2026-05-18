"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";

export type DepartmentOption = {
  id: string;
  code: string;
  name: string;
  faculty: {
    name: string;
  };
};

export type ProfessorListItem = {
  id: string;
  employeeCode: string;
  phone: string | null;
  academicTitle: string | null;
  office: string | null;
  departmentId: string | null;
  user: {
    name: string | null;
    email: string;
    institutionalId: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  };
  department: {
    name: string;
    faculty: {
      name: string;
    };
  } | null;
  sectionsCount: number;
};

type ApiResult = {
  message?: string;
  data?: ProfessorListItem;
  errors?: Record<string, string[] | undefined>;
};

export function ProfessorsTable({
  professors: initialProfessors,
  departments,
}: {
  professors: ProfessorListItem[];
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const [professorOverrides, setProfessorOverrides] = useState<
    Record<string, ProfessorListItem>
  >({});
  const [editingProfessorId, setEditingProfessorId] = useState<string | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const professors = initialProfessors.map(
    (professor) => professorOverrides[professor.id] ?? professor,
  );

  const editingProfessor =
    professors.find((professor) => professor.id === editingProfessorId) ?? null;

  function startEditing(professor: ProfessorListItem) {
    setEditingProfessorId(professor.id);
    setSuccessMessage("");
    setErrorMessage("");
  }

  function cancelEditing() {
    if (isSaving) return;
    setEditingProfessorId(null);
    setErrorMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingProfessor) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");
    const payload: Record<string, FormDataEntryValue | string> = {
      name: formData.get("name") ?? "",
      email: formData.get("email") ?? "",
      institutionalId: formData.get("institutionalId") ?? "",
      status: formData.get("status") ?? "",
      employeeCode: formData.get("employeeCode") ?? "",
      departmentId: formData.get("departmentId") ?? "",
      phone: formData.get("phone") ?? "",
      academicTitle: formData.get("academicTitle") ?? "",
      office: formData.get("office") ?? "",
    };

    if (password.trim()) {
      payload.password = password;
    }

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/professors/${editingProfessor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(formatApiError(result, response.status));
      }

      if (result?.data) {
        setProfessorOverrides((currentOverrides) => ({
          ...currentOverrides,
          [editingProfessor.id]: normalizeUpdatedProfessor(
            result.data!,
            editingProfessor,
          ),
        }));
      }

      form.reset();
      setEditingProfessorId(null);
      setSuccessMessage(
        result?.message ?? "Profesor actualizado correctamente.",
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el profesor.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (professors.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      {successMessage && <Alert tone="success" message={successMessage} />}
      {errorMessage && <Alert tone="error" message={errorMessage} />}

      {editingProfessor && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
              <h2 className="text-lg font-bold text-[#031b46]">
                Editar profesor
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Actualiza los datos académicos, el estado de acceso o asigna
                una nueva clave.
              </p>
            </div>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isSaving}
              title="Cancelar edición"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <X className="h-4 w-4" />
              Cancelar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-6">
            <Field label="Nombre" className="xl:col-span-2">
              <input
                name="name"
                required
                defaultValue={editingProfessor.user.name ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Email" className="xl:col-span-2">
              <input
                name="email"
                type="email"
                required
                defaultValue={editingProfessor.user.email}
                className={inputClassName}
              />
            </Field>
            <Field label="C.I. / ID">
              <input
                name="institutionalId"
                required
                defaultValue={editingProfessor.user.institutionalId}
                className={inputClassName}
              />
            </Field>
            <Field label="Estado">
              <select
                name="status"
                required
                defaultValue={editingProfessor.user.status}
                className={inputClassName}
              >
                <option value="ACTIVE">Activo</option>
                <option value="INACTIVE">Inactivo</option>
                <option value="SUSPENDED">Suspendido</option>
              </select>
            </Field>
            <Field label="Código empleado">
              <input
                name="employeeCode"
                required
                defaultValue={editingProfessor.employeeCode}
                className={inputClassName}
              />
            </Field>
            <Field label="Departamento" className="xl:col-span-2">
              <select
                name="departmentId"
                defaultValue={editingProfessor.departmentId ?? ""}
                className={inputClassName}
              >
                <option value="">Sin departamento</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.code} - {department.name} (
                    {department.faculty.name})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Teléfono">
              <input
                name="phone"
                defaultValue={editingProfessor.phone ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Título académico">
              <input
                name="academicTitle"
                defaultValue={editingProfessor.academicTitle ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Oficina">
              <input
                name="office"
                defaultValue={editingProfessor.office ?? ""}
                className={inputClassName}
              />
            </Field>
            <Field label="Nueva clave" className="xl:col-span-2">
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  minLength={8}
                  placeholder="Opcional, mínimo 8 caracteres"
                  className={`${inputClassName} pl-10`}
                />
              </div>
            </Field>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar cambios
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-240 text-left">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-4 font-bold">Profesor</th>
                <th className="px-6 py-4 font-bold">Código</th>
                <th className="px-6 py-4 font-bold">Facultad</th>
                <th className="px-6 py-4 font-bold">Departamento</th>
                <th className="px-6 py-4 font-bold">Título</th>
                <th className="px-6 py-4 font-bold">Oficina</th>
                <th className="px-6 py-4 font-bold">Secciones</th>
                <th className="px-6 py-4 font-bold">Estado</th>
                <th className="px-6 py-4 text-right font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {professors.map((professor) => (
                <tr key={professor.id} className="transition hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">
                      {professor.user.name ?? "Sin nombre"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {professor.user.email}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                      {professor.employeeCode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {professor.department?.faculty.name ?? "Sin facultad"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {professor.department?.name ?? "Sin departamento"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {professor.academicTitle ?? "Sin título"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {professor.office ?? "Sin oficina"}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {professor.sectionsCount}
                  </td>
                  <td className="px-6 py-4">
                    <StatusPill status={professor.user.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => startEditing(professor)}
                        title="Editar profesor"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-bold text-[#031b46] transition hover:bg-slate-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
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

function StatusPill({
  status,
}: {
  status: ProfessorListItem["user"]["status"];
}) {
  const styles = {
    ACTIVE: "bg-emerald-50 text-emerald-700",
    INACTIVE: "bg-slate-100 text-slate-600",
    SUSPENDED: "bg-red-50 text-red-700",
  };
  const labels = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    SUSPENDED: "Suspendido",
  };

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-bold ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("application/json")) {
    const text = await response.text().catch(() => "");

    return {
      message: text.trim() || undefined,
    } satisfies ApiResult;
  }

  return (await response.json().catch(() => null)) as ApiResult | null;
}

function formatApiError(result: ApiResult | null, status?: number) {
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
    name: "Nombre",
    email: "Email",
    institutionalId: "C.I. / ID",
    status: "Estado",
    password: "Nueva clave",
    employeeCode: "Código empleado",
    departmentId: "Departamento",
    phone: "Teléfono",
    academicTitle: "Título académico",
    office: "Oficina",
  };

  return labels[field] ?? field;
}

function normalizeUpdatedProfessor(
  updatedProfessor: ProfessorListItem,
  previousProfessor: ProfessorListItem,
) {
  return {
    ...previousProfessor,
    ...updatedProfessor,
    sectionsCount:
      updatedProfessor.sectionsCount ?? previousProfessor.sectionsCount,
  };
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";
