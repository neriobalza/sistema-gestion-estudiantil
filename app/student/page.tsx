export default function StudentDashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <section className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-500">
          Dashboard estudiante
        </p>
        <h1 className="mt-3 text-3xl font-bold text-[#031b46]">
          Panel de estudiante
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">
          Aquí se mostrará el historial académico, materias inscritas,
          promedio e inscripción del estudiante.
        </p>
      </section>
    </main>
  );
}
