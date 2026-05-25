"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Plus } from "lucide-react";

type CareerOption = {
  id: string;
  code: string;
  name: string;
};

type ApiResponse = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

type FormKind = "career" | "careerOption";

export function SchoolCareerForms({
  schoolId,
  careers,
}: {
  schoolId: string;
  careers: CareerOption[];
}) {
  const router = useRouter();
  const [formKind, setFormKind] = useState<FormKind>("career");
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const isCareer = formKind === "career";
    const endpoint = isCareer
      ? "/api/admin/careers"
      : "/api/admin/career-options";
    const payload = isCareer
      ? {
          schoolId,
          code: String(formData.get("code") ?? "").trim(),
          name: String(formData.get("name") ?? "").trim(),
          description: String(formData.get("description") ?? "").trim(),
        }
      : {
          careerId: String(formData.get("careerId") ?? "").trim(),
          code: String(formData.get("code") ?? "").trim(),
          name: String(formData.get("name") ?? "").trim(),
          description: String(formData.get("description") ?? "").trim(),
        };

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(endpoint, {
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
      setSuccessMessage(
        result?.message ??
          (isCareer
            ? "Carrera creada correctamente."
            : "Opción de carrera creada correctamente."),
      );
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el registro.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#031b46]">
              Crear carrera u opción
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Agrega carreras a esta escuela o registra opciones dentro de una
              carrera existente.
            </p>
          </div>
        </div>

        <div className="grid w-full grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1 md:w-80">
          <button
            type="button"
            onClick={() => setFormKind("career")}
            disabled={isSaving}
            className={getToggleClass(formKind === "career")}
          >
            Carrera
          </button>
          <button
            type="button"
            onClick={() => setFormKind("careerOption")}
            disabled={isSaving}
            className={getToggleClass(formKind === "careerOption")}
          >
            Opción
          </button>
        </div>
      </div>

      {successMessage && <Alert tone="success" message={successMessage} />}
      {errorMessage && <Alert tone="error" message={errorMessage} />}

      <form onSubmit={handleSubmit} className="mt-5 grid gap-4 xl:grid-cols-6">
        {formKind === "careerOption" && (
          <Field label="Carrera" className="xl:col-span-2">
            <select
              name="careerId"
              required
              disabled={isSaving || careers.length === 0}
              className={inputClassName}
            >
              <option value="">Selecciona una carrera</option>
              {careers.map((career) => (
                <option key={career.id} value={career.id}>
                  {career.code} - {career.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="Código">
          <input
            name="code"
            required
            minLength={2}
            maxLength={20}
            placeholder={formKind === "career" ? "SIS" : "SIS-SW"}
            className={inputClassName}
          />
        </Field>

        <Field label="Nombre" className="xl:col-span-2">
          <input
            name="name"
            required
            minLength={2}
            maxLength={160}
            placeholder={
              formKind === "career"
                ? "Ingeniería de Sistemas"
                : "Sistemas Computacionales"
            }
            className={inputClassName}
          />
        </Field>

        <Field
          label="Descripción"
          className={formKind === "career" ? "xl:col-span-2" : "xl:col-span-1"}
        >
          <input
            name="description"
            placeholder="Opcional"
            className={inputClassName}
          />
        </Field>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={
              isSaving || (formKind === "careerOption" && careers.length === 0)
            }
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70"
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

      {formKind === "careerOption" && careers.length === 0 && (
        <p className="mt-4 text-sm font-semibold text-amber-700">
          Primero debes crear una carrera para poder registrar opciones.
        </p>
      )}
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
    schoolId: "Escuela",
    careerId: "Carrera",
    code: "Código",
    name: "Nombre",
    description: "Descripción",
  };

  return labels[field] ?? field;
}

function getToggleClass(active: boolean) {
  return [
    "rounded-lg px-3 py-2 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-70",
    active ? "bg-[#031b46] text-white shadow-sm" : "text-slate-600 hover:bg-white",
  ].join(" ");
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";
