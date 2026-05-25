"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Plus, Printer } from "lucide-react";

type TermOption = {
  id: string;
  code: string;
  startsAt: string;
};

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
  curricula: {
    id: string;
    code: string;
    name: string;
    version: number;
  }[];
};

type ApiResponse = {
  message?: string;
  errors?: Record<string, string[] | undefined>;
  data?: AdmissionReceipt;
};

type AdmissionReceipt = {
  temporaryPassword: string;
  student: {
    studentCode: string;
    user: {
      name: string | null;
      email: string;
      institutionalId: string;
    };
    admissionTerm: {
      code: string;
      startsAt: string;
    } | null;
    currentCareerOption: {
      name: string;
      career: {
        name: string;
      };
    };
    curriculum: {
      name: string;
      code: string;
    };
  };
  schedule: ScheduleSection[];
};

type ScheduleSection = {
  id: string;
  sectionCode: string;
  modality: string;
  subject: {
    code: string;
    name: string;
  };
  professor: {
    user: {
      name: string | null;
    };
  } | null;
  schedules: {
    dayOfWeek: string;
    startMinute: number;
    endMinute: number;
    classroom: {
      code: string;
      building: string | null;
      room: string | null;
    } | null;
  }[];
};

export function CreateStudentAdmissionForm({
  terms,
  careerOptions,
}: {
  terms: TermOption[];
  careerOptions: CareerOption[];
}) {
  const router = useRouter();
  const [selectedCareerOptionId, setSelectedCareerOptionId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<AdmissionReceipt | null>(null);

  const selectedCareerOption = useMemo(
    () =>
      careerOptions.find(
        (careerOption) => careerOption.id === selectedCareerOptionId,
      ),
    [careerOptions, selectedCareerOptionId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setIsSaving(true);
    setMessage("");
    setError("");
    setReceipt(null);

    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          institutionalId: formData.get("institutionalId"),
          studentCode: formData.get("studentCode"),
          nationalId: formData.get("nationalId"),
          birthDate: formData.get("birthDate") || undefined,
          phone: formData.get("phone"),
          address: formData.get("address"),
          careerOptionId: formData.get("careerOptionId"),
          curriculumId: formData.get("curriculumId"),
          admissionTermId: formData.get("admissionTermId"),
        }),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok) {
        throw new Error(formatApiError(result));
      }

      form.reset();
      setSelectedCareerOptionId("");
      setMessage(result.message ?? "Estudiante registrado correctamente.");
      setReceipt(result.data ?? null);
      router.refresh();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "No se pudo registrar el estudiante.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h2 className="text-lg font-bold text-[#031b46]">
            Registrar admitido
          </h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Crea el usuario estudiantil, asigna las materias obligatorias de
            primer semestre y genera el comprobante de acceso.
          </p>
        </div>
        {receipt && (
          <button
            type="button"
            onClick={() => printReceipt(receipt)}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold text-[#031b46] transition hover:bg-slate-50"
          >
            <Printer className="h-4 w-4" />
            Exportar PDF
          </button>
        )}
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
        <Field label="Código estudiante">
          <input name="studentCode" required className={inputClass} />
        </Field>
        <Field label="C.I. nacional">
          <input name="nationalId" className={inputClass} />
        </Field>
        <Field label="Fecha nacimiento">
          <input name="birthDate" type="date" className={inputClass} />
        </Field>
        <Field label="Teléfono">
          <input name="phone" className={inputClass} />
        </Field>
        <Field label="Período de inicio" className="xl:col-span-2">
          <select name="admissionTermId" required className={inputClass}>
            <option value="">Selecciona período planificado</option>
            {terms.map((term) => (
              <option key={term.id} value={term.id}>
                {term.code} - inicia {formatDate(term.startsAt)}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Carrera / opción" className="xl:col-span-2">
          <select
            name="careerOptionId"
            required
            value={selectedCareerOptionId}
            onChange={(event) => setSelectedCareerOptionId(event.target.value)}
            className={inputClass}
          >
            <option value="">Selecciona carrera</option>
            {careerOptions.map((careerOption) => (
              <option key={careerOption.id} value={careerOption.id}>
                {careerOption.career.name} - {careerOption.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Pensum activo" className="xl:col-span-2">
          <select
            name="curriculumId"
            required
            disabled={!selectedCareerOption}
            className={inputClass}
          >
            <option value="">Selecciona pensum</option>
            {selectedCareerOption?.curricula.map((curriculum) => (
              <option key={curriculum.id} value={curriculum.id}>
                {curriculum.code} - {curriculum.name} v{curriculum.version}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Dirección" className="xl:col-span-5">
          <input name="address" className={inputClass} />
        </Field>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={isSaving || terms.length === 0}
            className={buttonClass}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Registrar
          </button>
        </div>
      </form>

      {terms.length === 0 && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          No hay períodos planificados futuros disponibles para admitir
          estudiantes.
        </p>
      )}
      {message && (
        <p className="mt-4 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      )}
      {error && <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>}
      {receipt && <ReceiptPreview receipt={receipt} />}
    </section>
  );
}

function ReceiptPreview({ receipt }: { receipt: AdmissionReceipt }) {
  return (
    <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex items-start gap-3">
        <FileText className="mt-0.5 h-5 w-5 text-emerald-700" />
        <div>
          <p className="text-sm font-bold text-emerald-800">
            Comprobante generado para {receipt.student.user.name}
          </p>
          <p className="mt-1 text-sm text-emerald-700">
            Clave temporal:{" "}
            <span className="font-mono font-bold">
              {receipt.temporaryPassword}
            </span>
          </p>
        </div>
      </div>
    </div>
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

const inputClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 disabled:bg-slate-50 disabled:text-slate-400";

const buttonClass =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 text-sm font-bold text-white transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70";

function printReceipt(receipt: AdmissionReceipt) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return;

  printWindow.document.write(buildReceiptHtml(receipt));
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

function buildReceiptHtml(receipt: AdmissionReceipt) {
  const rows = receipt.schedule
    .flatMap((section) =>
      section.schedules.map(
        (schedule) => `
          <tr>
            <td>${escapeHtml(section.subject.code)} - ${escapeHtml(section.subject.name)}</td>
            <td>${escapeHtml(section.sectionCode)}</td>
            <td>${escapeHtml(section.professor?.user.name ?? "Sin profesor")}</td>
            <td>${dayLabel(schedule.dayOfWeek)}</td>
            <td>${formatMinutes(schedule.startMinute)} - ${formatMinutes(schedule.endMinute)}</td>
            <td>${escapeHtml(schedule.classroom?.code ?? "Sin aula")}</td>
          </tr>
        `,
      ),
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprobante de admisión</title>
        <style>
          body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
          h1 { color: #031b46; margin: 0 0 8px; }
          h2 { color: #031b46; margin-top: 28px; font-size: 18px; }
          .muted { color: #64748b; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 20px; }
          .box { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; }
          .label { color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; }
          .value { margin-top: 4px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 13px; }
          th { background: #f8fafc; color: #334155; }
          .password { font-family: monospace; font-size: 18px; }
        </style>
      </head>
      <body>
        <h1>Comprobante de admisión</h1>
        <p class="muted">Horario asignado y credenciales temporales de ingreso.</p>
        <div class="grid">
          <div class="box">
            <div class="label">Estudiante</div>
            <div class="value">${escapeHtml(receipt.student.user.name ?? "Sin nombre")}</div>
          </div>
          <div class="box">
            <div class="label">Código</div>
            <div class="value">${escapeHtml(receipt.student.studentCode)}</div>
          </div>
          <div class="box">
            <div class="label">Correo</div>
            <div class="value">${escapeHtml(receipt.student.user.email)}</div>
          </div>
          <div class="box">
            <div class="label">Clave temporal</div>
            <div class="value password">${escapeHtml(receipt.temporaryPassword)}</div>
          </div>
          <div class="box">
            <div class="label">Carrera</div>
            <div class="value">${escapeHtml(receipt.student.currentCareerOption.career.name)} - ${escapeHtml(receipt.student.currentCareerOption.name)}</div>
          </div>
          <div class="box">
            <div class="label">Período</div>
            <div class="value">${escapeHtml(receipt.student.admissionTerm?.code ?? "Sin período")}</div>
          </div>
        </div>
        <h2>Horario asignado</h2>
        <table>
          <thead>
            <tr>
              <th>Materia</th>
              <th>Sección</th>
              <th>Profesor</th>
              <th>Día</th>
              <th>Hora</th>
              <th>Aula</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function formatApiError(result: ApiResponse) {
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
    studentCode: "Código estudiante",
    nationalId: "C.I. nacional",
    birthDate: "Fecha nacimiento",
    phone: "Teléfono",
    address: "Dirección",
    careerOptionId: "Carrera",
    curriculumId: "Pensum",
    admissionTermId: "Período",
  };

  return labels[field] ?? field;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function dayLabel(day: string) {
  const labels: Record<string, string> = {
    MONDAY: "Lunes",
    TUESDAY: "Martes",
    WEDNESDAY: "Miércoles",
    THURSDAY: "Jueves",
    FRIDAY: "Viernes",
    SATURDAY: "Sábado",
    SUNDAY: "Domingo",
  };

  return labels[day] ?? day;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
