"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, KeyRound, Loader2, Save, XCircle } from "lucide-react";

type StudentEditData = {
  id: string;
  studentCode: string;
  nationalId: string | null;
  birthDate: string | null;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "GRADUATED" | "WITHDRAWN" | "SUSPENDED";
  user: {
    name: string | null;
    email: string;
    institutionalId: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  };
};

type ApiResult = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export function StudentDetailEditForm({ student }: { student: StudentEditData }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const password = String(formData.get("password") ?? "");

    const payload: Record<string, unknown> = {
      name: formData.get("name") ?? "",
      email: formData.get("email") ?? "",
      institutionalId: formData.get("institutionalId") ?? "",
      userStatus: formData.get("userStatus") ?? "",
      studentCode: formData.get("studentCode") ?? "",
      nationalId: formData.get("nationalId") ?? "",
      birthDate: formData.get("birthDate") || null,
      phone: formData.get("phone") ?? "",
      address: formData.get("address") ?? "",
      status: formData.get("status") ?? "",
    };

    if (password.trim()) {
      payload.password = password;
    }

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResult;

      if (!response.ok) {
        throw new Error(formatApiError(result));
      }

      form.reset();
      setSuccessMessage(result.message ?? "Estudiante actualizado correctamente.");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar el estudiante.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-[#031b46]">
            Editar estudiante
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Actualiza datos personales, estado de acceso o asigna una nueva
            contraseña temporal.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 xl:grid-cols-6">
        <Field label="Nombre" className="xl:col-span-2">
          <input
            name="name"
            required
            defaultValue={student.user.name ?? ""}
            className={inputClassName}
          />
        </Field>
        <Field label="Email" className="xl:col-span-2">
          <input
            name="email"
            type="email"
            required
            defaultValue={student.user.email}
            className={inputClassName}
          />
        </Field>
        <Field label="C.I. / ID">
          <input
            name="institutionalId"
            required
            defaultValue={student.user.institutionalId}
            className={inputClassName}
          />
        </Field>
        <Field label="Estado acceso">
          <select
            name="userStatus"
            required
            defaultValue={student.user.status}
            className={inputClassName}
          >
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
        </Field>
        <Field label="Código estudiante">
          <input
            name="studentCode"
            required
            defaultValue={student.studentCode}
            className={inputClassName}
          />
        </Field>
        <Field label="Estado académico">
          <select
            name="status"
            required
            defaultValue={student.status}
            className={inputClassName}
          >
            <option value="ACTIVE">Activo</option>
            <option value="GRADUATED">Graduado</option>
            <option value="WITHDRAWN">Retirado</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
        </Field>
        <Field label="C.I. nacional">
          <input
            name="nationalId"
            defaultValue={student.nationalId ?? ""}
            className={inputClassName}
          />
        </Field>
        <Field label="Fecha nacimiento">
          <input
            name="birthDate"
            type="date"
            defaultValue={student.birthDate ?? ""}
            className={inputClassName}
          />
        </Field>
        <Field label="Teléfono">
          <input
            name="phone"
            defaultValue={student.phone ?? ""}
            className={inputClassName}
          />
        </Field>
        <Field label="Nueva contraseña" className="xl:col-span-2">
          <input
            name="password"
            type="password"
            minLength={8}
            placeholder="Dejar vacío para conservar"
            className={inputClassName}
          />
        </Field>
        <Field label="Dirección" className="xl:col-span-4">
          <input
            name="address"
            defaultValue={student.address ?? ""}
            className={inputClassName}
          />
        </Field>
        <div className="flex items-end xl:col-span-2">
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

      {successMessage && (
        <Alert tone="success" message={successMessage} />
      )}
      {errorMessage && <Alert tone="error" message={errorMessage} />}
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
  const Icon = tone === "success" ? CheckCircle2 : XCircle;
  const className =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div
      className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-semibold ${className}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

const inputClassName =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10";

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
    userStatus: "Estado acceso",
    studentCode: "Código estudiante",
    status: "Estado académico",
    nationalId: "C.I. nacional",
    birthDate: "Fecha nacimiento",
    phone: "Teléfono",
    address: "Dirección",
    password: "Nueva contraseña",
  };

  return labels[field] ?? field;
}
