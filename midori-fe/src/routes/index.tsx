import { createFileRoute, redirect } from "@tanstack/react-router";
import { SakuraBg } from "@/components/sakura-bg";
import { isStudentActive } from "@/lib/auth";
import type { User } from "@/lib/auth";

import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingHero } from "@/components/landing/LandingHero";
import { FeatureSlideshow } from "@/components/landing/FeatureSlideshow";
import { GuideSteps } from "@/components/landing/GuideSteps";
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { ConsultationForm } from "@/components/landing/ConsultationForm";
import { LandingCTA } from "@/components/landing/LandingCTA";
import { LandingFooter } from "@/components/landing/LandingFooter";

import { TeacherTeam } from "@/components/landing/TeacherTeam";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // We no longer redirect guest students to intro. They stay on the landing page.
    // So no redirect logic here.
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen font-sans bg-background text-foreground">
      <SakuraBg count={22} />
      <LandingHeader />
      
      <main>
        <LandingHero />
        <FeatureSlideshow />
        <GuideSteps />
        <BenefitsSection />
        <TeacherTeam />
        <ConsultationForm />
        <LandingCTA />
      </main>

      <LandingFooter />
    </div>
  );
}
