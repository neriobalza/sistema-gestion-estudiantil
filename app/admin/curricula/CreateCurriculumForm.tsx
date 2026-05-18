"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

type CareerOption = {
  id: string;
  code: string;
  name: string;
  career: {
    name: string;
    school: {
      name: string;
    };
  };
};

type TermOption = {
  id: string;
  code: string;
};

export function CreateCurriculumForm({
  careerOptions,
  terms,
}: {
  careerOptions: CareerOption[];
  terms: TermOption[];
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
      const response = await fetch("/api/admin/curricula", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerOptionId: formData.get("careerOptionId"),
          code: formData.get("code"),
          name: formData.get("name"),
          version: formData.get("version"),
          status: formData.get("status"),
          totalCredits: formData.get("totalCredits") || null,
          effectiveFromTermId: formData.get("effectiveFromTermId") || "",
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message);

      form.reset();
      setMessage(result.message ?? "Pensum creado correctamente.");
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el pensum.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#031b46]">Crear pensum</h2>
        <p className="mt-1 text-sm text-slate-500">
          Define el pensum de una opción de carrera.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-6">
        <Field label="Opción de carrera" className="xl:col-span-2">
          <select name="careerOptionId" required className={inputClass}>
            <option value="">Selecciona una opción</option>
            {careerOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.career.name} / {option.name} ({option.career.school.name})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Código">
          <input name="code" required placeholder="SIS-2026" className={inputClass} />
        </Field>
        <Field label="Nombre" className="xl:col-span-2">
          <input name="name" required placeholder="Pensum 2026" className={inputClass} />
        </Field>
        <Field label="Versión">
          <input name="version" type="number" min={1} required className={inputClass} />
        </Field>
        <Field label="Estado">
          <select name="status" className={inputClass} defaultValue="DRAFT">
            <option value="DRAFT">Borrador</option>
            <option value="ACTIVE">Activo</option>
            <option value="ARCHIVED">Archivado</option>
          </select>
        </Field>
        <Field label="Créditos totales">
          <input name="totalCredits" type="number" min={1} className={inputClass} />
        </Field>
        <Field label="Vigente desde" className="xl:col-span-2">
          <select name="effectiveFromTermId" className={inputClass}>
            <option value="">Sin vigencia</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.code}
              </option>
            ))}
          </select>
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
