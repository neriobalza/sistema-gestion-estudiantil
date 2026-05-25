import Image from "next/image";
import Link from "next/link";
import { Compass, LockKeyhole } from "lucide-react";
import { auth } from "@/auth";

export async function Hero() {
  const session = await auth();

  return (
    <section
      id="inicio"
      className="relative isolate overflow-hidden bg-[#061b3a]"
    >
      {/* Imagen de fondo */}
      <Image
        src="/images/Hero.png"
        alt="Estudiantes universitarios usando una laptop en el campus"
        fill
        priority
        className="absolute inset-0 -z-20 object-cover object-center"
      />

      {/* Degradado principal detrás del texto */}
      <div className="absolute inset-0 -z-10 bg-linear-to-r from-[#061b3a] via-[#061b3a]/85 to-[#061b3a]/20" />

      {/* Degradado inferior para dar profundidad */}
      <div className="absolute inset-x-0 bottom-0 -z-10 h-40 bg-linear-to-r from-[#061b3a]/80 to-transparent" />

      <div className="mx-auto flex min-h-155 max-w-7xl items-center px-6 py-24 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Gestiona tu vida académica desde un solo lugar
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-100">
            Consulta tu historial de notas, inscríbete en materias, revisa tu
            progreso académico y mantén tu información actualizada de forma
            simple y segura.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            {!session && (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-yellow-400 px-6 py-3.5 text-sm font-bold text-[#061b3a] shadow-lg shadow-yellow-400/20 transition hover:bg-yellow-300"
              >
                <LockKeyhole size={19} />
                Iniciar sesión
              </Link>
            )}

            <Link
              href="#servicios"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Compass size={19} />
              Explorar plataforma
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
