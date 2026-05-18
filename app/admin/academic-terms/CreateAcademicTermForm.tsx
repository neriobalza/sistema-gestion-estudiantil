"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

type FacultyOption = {
  id: string;
  code: string;
  name: string;
};

export function CreateAcademicTermForm({
  faculties,
}: {
  faculties: FacultyOption[];
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
      const response = await fetch("/api/admin/academic-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: formData.get("code"),
          year: formData.get("year"),
          period: formData.get("period"),
          startsAt: formData.get("startsAt"),
          endsAt: formData.get("endsAt"),
          status: formData.get("status"),
          facultyId: formData.get("facultyId") || "",
          enrollmentName: formData.get("enrollmentName"),
        }),
      });
      const result = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(result.message);

      form.reset();
      setMessage(result.message ?? "Periodo creado correctamente.");
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo crear el periodo.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-[#031b46]">Crear período</h2>
        <p className="mt-1 text-sm text-slate-500">
          Crea el período académico y, si eliges facultad, su ventana de inscripción para toda la facultad.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-6">
        <Field label="Código">
          <input name="code" required placeholder="A2026" className={inputClass} />
        </Field>
        <Field label="Año">
          <input name="year" type="number" min={1900} required className={inputClass} />
        </Field>
        <Field label="Periodo">
          <select name="period" required className={inputClass}>
            <option value="FIRST">Primera mitad</option>
            <option value="SECOND">Segunda mitad</option>
            <option value="SUMMER">Verano</option>
          </select>
        </Field>
        <Field label="Inicio">
          <input name="startsAt" type="date" required className={inputClass} />
        </Field>
        <Field label="Fin">
          <input name="endsAt" type="date" required className={inputClass} />
        </Field>
        <Field label="Estado">
          <select name="status" defaultValue="PLANNED" className={inputClass}>
            <option value="PLANNED">Planificado</option>
            <option value="ACTIVE">Activo</option>
            <option value="CLOSED">Cerrado</option>
          </select>
        </Field>
        <Field label="Facultad" className="xl:col-span-2">
          <select name="facultyId" className={inputClass}>
            <option value="">Sin ventana de inscripción</option>
            {faculties.map((faculty) => (
              <option key={faculty.id} value={faculty.id}>
                {faculty.code} - {faculty.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nombre de inscripción" className="xl:col-span-3">
          <input name="enrollmentName" placeholder="Inscripción A2026" className={inputClass} />
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
