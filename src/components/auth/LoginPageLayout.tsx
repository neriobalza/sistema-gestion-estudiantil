import Image from "next/image";
import { LoginBrandPanel } from "./LoginBrandPanel";
import { LoginForm } from "./LoginForm";
import Header from "../layout/Header";

export function LoginPageLayout() {
  return (
    <>
      <Header />
      <main className="relative min-h-[calc(100dvh-5rem)] bg-[#061b3a]/95 text-slate-900">
        <Image
          src="/images/Hero.png"
          alt="Estudiantes universitarios usando una laptop"
          fill
          priority
          className="max-w-7xl inset-0 object-cover object-right mx-auto"
        />
        <section className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-7xl overflow-hidden lg:grid-cols-[1.1fr_0.9fr]">
          <LoginBrandPanel />

          <div className="relative flex items-center justify-center py-8 px-4 bg-white sm:px-8 sm:py-16 lg:px-16 ">
            <LoginForm />
          </div>
        </section>
      </main>
    </>
  );
}
