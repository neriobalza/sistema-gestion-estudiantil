// src/app/admin/faculties/_components/CreateFacultyForm.tsx

"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Building2, Loader2, Plus } from "lucide-react";
import { createFacultyAction, type CreateFacultyState } from "./actions";

const initialState: CreateFacultyState = {
  status: "idle",
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#031b46] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#05265f] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          Crear facultad
        </>
      )}
    </button>
  );
}

export function CreateFacultyForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState(createFacultyAction, initialState);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <Building2 className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#031b46]">
            Registrar facultad
          </h2>
          <p className="text-sm text-slate-500">
            Agrega una nueva facultad al sistema académico.
          </p>
        </div>
      </div>

      <form ref={formRef} action={formAction} className="space-y-5">
        <div>
          <label
            htmlFor="code"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Código
          </label>

          <input
            id="code"
            name="code"
            type="text"
            placeholder="Ej: FING"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
          />

          {state.errors?.code && (
            <p className="mt-2 text-sm text-red-600">{state.errors.code[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Nombre
          </label>

          <input
            id="name"
            name="name"
            type="text"
            placeholder="Ej: Facultad de Ingeniería"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
          />

          {state.errors?.name && (
            <p className="mt-2 text-sm text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Descripción
          </label>

          <textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Descripción opcional de la facultad..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10"
          />

          {state.errors?.description && (
            <p className="mt-2 text-sm text-red-600">
              {state.errors.description[0]}
            </p>
          )}
        </div>

        {state.message && (
          <div
            className={[
              "rounded-xl px-4 py-3 text-sm font-medium",
              state.status === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700",
            ].join(" ")}
          >
            {state.message}
          </div>
        )}

        <SubmitButton />
      </form>
    </section>
  );
}
