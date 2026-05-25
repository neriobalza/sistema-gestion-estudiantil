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

export function CreateSubjectForm({
  departments,
}: {
  departments: DepartmentOption[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setMessage("");
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: formData.get("departmentId"),
          code: formData.get("code"),
          name: formData.get("name"),
          description: formData.get("description"),
          credits: formData.get("credits"),
          hoursPerWeek: formData.get("hoursPerWeek") || undefined,
          isActive: formData.get("isActive") === "on",
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message);

      form.reset();
      setMessage(result.message ?? "Materia creada correctamente.");
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear la materia.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#031b46]">Crear materia</h2>
        <p className="mt-1 text-sm text-slate-500">
          Registra una materia base asociada a un departamento.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-6">
        <Field label="Departamento" className="xl:col-span-2">
          <select name="departmentId" required className={inputClass}>
            <option value="">Selecciona un departamento</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.code} - {department.name} ({department.faculty.name})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Código">
          <input name="code" required placeholder="INF101" className={inputClass} />
        </Field>

        <Field label="Nombre" className="xl:col-span-2">
          <input
            name="name"
            required
            placeholder="Programación I"
            className={inputClass}
          />
        </Field>

        <Field label="Créditos">
          <input
            name="credits"
            type="number"
            min={1}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Horas semanales">
          <input name="hoursPerWeek" type="number" min={1} className={inputClass} />
        </Field>

        <Field label="Descripción" className="xl:col-span-4">
          <input name="description" placeholder="Opcional" className={inputClass} />
        </Field>

        <label className="flex items-center gap-3 pt-7 text-sm font-bold text-[#031b46]">
          <input name="isActive" type="checkbox" defaultChecked />
          Activa
        </label>

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
