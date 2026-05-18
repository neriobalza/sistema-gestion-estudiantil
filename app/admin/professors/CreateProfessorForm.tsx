"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

type DepartmentOption = {
  id: string;
  code: string;
  name: string;
  faculty: {
    name: string;
  };
};

type ApiResult = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export function CreateProfessorForm({
  departments,
}: {
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/admin/professors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          institutionalId: formData.get("institutionalId"),
          password: formData.get("password"),
          employeeCode: formData.get("employeeCode"),
          departmentId: formData.get("departmentId") || "",
          phone: formData.get("phone"),
          academicTitle: formData.get("academicTitle"),
          office: formData.get("office"),
        }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok) {
        throw new Error(formatApiError(result));
      }

      form.reset();
      setMessage(result.message ?? "Profesor creado correctamente.");
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el profesor.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#031b46]">Crear profesor</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registra el usuario docente y su perfil académico.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-6">
        <Field label="Nombre" className="xl:col-span-2">
          <input name="name" required className={inputClass} />
        </Field>
        <Field label="Email" className="xl:col-span-2">
          <input name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="C.I. / ID">
          <input name="institutionalId" required className={inputClass} />
        </Field>
        <Field label="Clave inicial">
          <input
            name="password"
            type="password"
            minLength={8}
            required
            placeholder="Mínimo 8 caracteres"
            className={inputClass}
          />
        </Field>
        <Field label="Código empleado">
          <input name="employeeCode" required className={inputClass} />
        </Field>
        <Field label="Departamento" className="xl:col-span-2">
          <select name="departmentId" className={inputClass}>
            <option value="">Sin departamento</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.code} - {department.name} ({department.faculty.name})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Teléfono">
          <input name="phone" className={inputClass} />
        </Field>
        <Field label="Título académico">
          <input name="academicTitle" className={inputClass} />
        </Field>
        <Field label="Oficina">
          <input name="office" className={inputClass} />
        </Field>
        <div className="flex items-end">
          <button type="submit" disabled={isSaving} className={buttonClass}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Guardar
          </button>
        </div>
      </form>

      {message && <p className="mt-4 text-sm font-semibold text-emerald-700">{message}</p>}
      {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
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
      <span className="mb-2 block text-sm font-bold text-[#031b46]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";

const buttonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70";

function formatApiError(result: ApiResult) {
  const fieldErrors = result.errors
    ? Object.entries(result.errors)
        .flatMap(([field, messages]) =>
          (messages ?? []).map((message) => `${getFieldLabel(field)}: ${message}`),
        )
        .join(" · ")
    : "";

  return [result.message, fieldErrors].filter(Boolean).join(" · ");
}

function getFieldLabel(field: string) {
  const labels: Record<string, string> = {
    name: "Nombre",
    email: "Email",
    institutionalId: "C.I. / ID",
    password: "Clave inicial",
    employeeCode: "Código empleado",
    departmentId: "Departamento",
    phone: "Teléfono",
    academicTitle: "Título académico",
    office: "Oficina",
  };

  return labels[field] ?? field;
}
