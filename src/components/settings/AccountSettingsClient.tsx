"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  IdCard,
  Loader2,
  LockKeyhole,
  Mail,
  Save,
  UserRound,
} from "lucide-react";
import { Role } from "@/src/generated/prisma/enums";

type AccountData = {
  id: string;
  name: string | null;
  email: string;
  institutionalId: string;
  role: Role;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
  adminProfile: {
    employeeCode: string | null;
    position: string | null;
  } | null;
  professorProfile: {
    employeeCode: string;
    phone: string | null;
    academicTitle: string | null;
    office: string | null;
    department: {
      code: string;
      name: string;
      faculty: {
        code: string;
        name: string;
      };
    } | null;
  } | null;
  studentProfile: {
    studentCode: string;
    nationalId: string | null;
    birthDate: string | null;
    phone: string | null;
    address: string | null;
    status: string;
    admissionTerm: {
      code: string;
    } | null;
    currentCareerOption: {
      code: string;
      name: string;
      career: {
        code: string;
        name: string;
        school: {
          code: string;
          name: string;
        };
      };
    };
    curriculum: {
      code: string;
      name: string;
      version: number;
    };
  } | null;
};

type ApiResponse = {
  data?: AccountData;
  message?: string;
  errors?: Record<string, string[] | undefined>;
};

export function AccountSettingsClient() {
  const router = useRouter();
  const [account, setAccount] = useState<AccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<
    Record<string, string[] | undefined>
  >({});

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      try {
        const response = await fetch("/api/account", {
          cache: "no-store",
        });
        const result = (await response.json()) as ApiResponse;

        if (!response.ok || !result.data) {
          throw new Error(result.message ?? "No se pudo cargar la cuenta");
        }

        if (active) setAccount(result.data);
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "No se pudo cargar la cuenta",
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    loadAccount();

    return () => {
      active = false;
    };
  }, []);

  const readOnlyFields = useMemo(() => {
    if (!account) return [];

    const fields = [
      ["Rol", getRoleLabel(account.role)],
      ["Estado de usuario", getStatusLabel(account.status)],
      ["ID institucional", account.institutionalId],
      ["Fecha de registro", formatDate(account.createdAt)],
    ];

    if (account.role === Role.PROFESSOR && account.professorProfile) {
      fields.push(
        ["Codigo de empleado", account.professorProfile.employeeCode],
        ["Telefono", account.professorProfile.phone ?? "No registrado"],
        [
          "Titulo academico",
          account.professorProfile.academicTitle ?? "No registrado",
        ],
        ["Oficina", account.professorProfile.office ?? "No registrada"],
        [
          "Departamento",
          account.professorProfile.department
            ? `${account.professorProfile.department.code} - ${account.professorProfile.department.name}`
            : "No asignado",
        ],
      );
    }

    if (account.role === Role.STUDENT && account.studentProfile) {
      fields.push(
        ["Codigo de estudiante", account.studentProfile.studentCode],
        ["Cedula", account.studentProfile.nationalId ?? "No registrada"],
        ["Estado academico", getStatusLabel(account.studentProfile.status)],
        ["Telefono", account.studentProfile.phone ?? "No registrado"],
        ["Direccion", account.studentProfile.address ?? "No registrada"],
        [
          "Carrera",
          `${account.studentProfile.currentCareerOption.career.code} - ${account.studentProfile.currentCareerOption.career.name}`,
        ],
        [
          "Opcion",
          `${account.studentProfile.currentCareerOption.code} - ${account.studentProfile.currentCareerOption.name}`,
        ],
        [
          "Pensum",
          `${account.studentProfile.curriculum.code} v${account.studentProfile.curriculum.version}`,
        ],
      );
    }

    return fields;
  }, [account]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!account) return;

    setIsSaving(true);
    setSuccessMessage("");
    setErrorMessage("");
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const passwordConfirmation = String(
      formData.get("passwordConfirmation") ?? "",
    );

    if (password || passwordConfirmation) {
      if (password !== passwordConfirmation) {
        setIsSaving(false);
        setFieldErrors({
          passwordConfirmation: ["Las contrasenas no coinciden"],
        });
        return;
      }
    }

    const payload: Record<string, string> = {};
    const editableFields =
      account.role === Role.ADMIN
        ? ["name", "email", "institutionalId", "employeeCode", "position"]
        : ["email"];

    for (const field of editableFields) {
      const value = String(formData.get(field) ?? "").trim();
      payload[field] = value;
    }

    if (password) payload.password = password;

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.data) {
        setFieldErrors(result.errors ?? {});
        throw new Error(result.message ?? "No se pudo actualizar la cuenta");
      }

      setAccount(result.data);
      setSuccessMessage(result.message ?? "Cuenta actualizada correctamente");
      event.currentTarget.reset();
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la cuenta",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
          <Loader2 className="h-5 w-5 animate-spin text-[#031b46]" />
          Cargando configuracion
        </div>
      </div>
    );
  }

  if (!account) {
    return (
      <AlertMessage
        tone="error"
        message={errorMessage || "No se pudo cargar la cuenta"}
      />
    );
  }

  const isAdmin = account.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <section className="border-b border-slate-200 pb-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase text-amber-600">
              Cuenta
            </p>
            <h2 className="mt-1 text-2xl font-bold text-[#031b46]">
              Configuracion personal
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {isAdmin
                ? "Puedes actualizar tus datos de cuenta y perfil administrativo."
                : "Puedes actualizar tu correo y contrasena. Los demas datos son gestionados por administracion."}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#031b46] text-sm font-bold text-white">
              {getInitials(account.name ?? account.email)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#031b46]">
                {account.name ?? "Usuario"}
              </p>
              <p className="truncate text-xs font-medium text-slate-500">
                {getRoleLabel(account.role)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {successMessage && <AlertMessage tone="success" message={successMessage} />}
      {errorMessage && <AlertMessage tone="error" message={errorMessage} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-400/15 text-amber-600">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#031b46]">
                Datos editables
              </h3>
              <p className="text-sm text-slate-500">
                Los cambios se guardan en tu cuenta activa.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {isAdmin && (
              <TextField
                name="name"
                label="Nombre"
                icon={UserRound}
                defaultValue={account.name ?? ""}
                error={fieldErrors.name?.[0]}
              />
            )}

            <TextField
              name="email"
              label="Correo"
              type="email"
              icon={Mail}
              defaultValue={account.email}
              error={fieldErrors.email?.[0]}
            />

            {isAdmin && (
              <>
                <TextField
                  name="institutionalId"
                  label="ID institucional"
                  icon={IdCard}
                  defaultValue={account.institutionalId}
                  error={fieldErrors.institutionalId?.[0]}
                />
                <TextField
                  name="employeeCode"
                  label="Codigo de empleado"
                  icon={IdCard}
                  defaultValue={account.adminProfile?.employeeCode ?? ""}
                  error={fieldErrors.employeeCode?.[0]}
                />
                <TextField
                  name="position"
                  label="Cargo"
                  icon={BadgeCheck}
                  defaultValue={account.adminProfile?.position ?? ""}
                  error={fieldErrors.position?.[0]}
                />
              </>
            )}

            <TextField
              name="password"
              label="Nueva contrasena"
              type="password"
              icon={LockKeyhole}
              defaultValue=""
              autoComplete="new-password"
              error={fieldErrors.password?.[0]}
            />
            <TextField
              name="passwordConfirmation"
              label="Confirmar contrasena"
              type="password"
              icon={LockKeyhole}
              defaultValue=""
              autoComplete="new-password"
              error={fieldErrors.passwordConfirmation?.[0]}
            />
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#031b46] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#06265f] disabled:cursor-not-allowed disabled:opacity-70"
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

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#031b46]/10 text-[#031b46]">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#031b46]">
                Datos registrados
              </h3>
              <p className="text-sm text-slate-500">
                Informacion actual de tu perfil.
              </p>
            </div>
          </div>

          <dl className="grid gap-3">
            <ReadOnlyField label="Nombre" value={account.name ?? "Usuario"} />
            <ReadOnlyField label="Correo" value={account.email} />
            {readOnlyFields.map(([label, value]) => (
              <ReadOnlyField key={label} label={label} value={value} />
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

function TextField({
  name,
  label,
  icon: Icon,
  type = "text",
  defaultValue,
  autoComplete,
  error,
}: {
  name: string;
  label: string;
  icon: typeof UserRound;
  type?: string;
  defaultValue: string;
  autoComplete?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <span className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-700 focus-within:border-[#031b46] focus-within:ring-2 focus-within:ring-[#031b46]/10">
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
        />
      </span>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <dt className="text-xs font-bold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function AlertMessage({
  tone,
  message,
}: {
  tone: "success" | "error";
  message: string;
}) {
  const isSuccess = tone === "success";

  return (
    <div
      className={[
        "flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-semibold",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-red-200 bg-red-50 text-red-700",
      ].join(" ")}
    >
      {isSuccess ? (
        <BadgeCheck className="h-5 w-5 shrink-0" />
      ) : (
        <AlertCircle className="h-5 w-5 shrink-0" />
      )}
      {message}
    </div>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(" ");

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getRoleLabel(role: Role) {
  const labels: Record<Role, string> = {
    ADMIN: "Administrador",
    PROFESSOR: "Profesor",
    STUDENT: "Estudiante",
  };

  return labels[role];
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    ACTIVE: "Activo",
    INACTIVE: "Inactivo",
    SUSPENDED: "Suspendido",
    GRADUATED: "Graduado",
    WITHDRAWN: "Retirado",
  };

  return labels[status] ?? status;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-VE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
}
