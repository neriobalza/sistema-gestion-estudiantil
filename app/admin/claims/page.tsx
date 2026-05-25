import { ClipboardList } from "lucide-react";
import { requireAdmin } from "@/src/lib/auth/require-admin";

export const dynamic = "force-dynamic";

export default async function AdminClaimsPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-[#031b46] md:text-3xl">
          Reclamos
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-500">
          Gestiona solicitudes, incidencias y reclamos académicos reportados por
          estudiantes o docentes.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Reclamos" value={0} />
        <MetricCard label="Pendientes" value={0} />
        <MetricCard label="Resueltos" value={0} />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex min-h-80 flex-col items-center justify-center p-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-500">
            <ClipboardList className="h-8 w-8" />
          </div>
          <h2 className="mt-4 text-lg font-bold text-[#031b46]">
            Módulo de reclamos pendiente
          </h2>
          <p className="mt-2 max-w-md text-sm text-slate-500">
            La interfaz ya está disponible, pero aún falta crear el modelo de
            reclamos en la base de datos para almacenar y consultar casos reales.
          </p>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400/10 text-amber-500">
          <ClipboardList className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#031b46]">{label}</p>
          <p className="mt-1 text-3xl font-bold text-[#031b46]">{value}</p>
        </div>
      </div>
    </article>
  );
}
