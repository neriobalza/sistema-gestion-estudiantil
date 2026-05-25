import Footer from "@/src/components/layout/Footer";
import { Hero } from "@/src/components/landing/Hero";
import { FeaturesSection } from "@/src/components/landing/FeaturesSection";
import { StatsSection } from "@/src/components/landing/StatsSection";
import { StepsSection } from "@/src/components/landing/StepsSection";
import { TestimonialSection } from "@/src/components/landing/TestimonialSection";
import Header from "@/src/components/layout/Header";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDashboardRoute } from "@/src/lib/auth/dashboard-route";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect(getDashboardRoute(session.user.role));
  }

  return (
    <>
      <Header />
      <div className="">
        <Hero />
        <FeaturesSection />
        <StatsSection />
        <StepsSection />
        <TestimonialSection />
        <Footer />
      </div>
    </>
  );
}
