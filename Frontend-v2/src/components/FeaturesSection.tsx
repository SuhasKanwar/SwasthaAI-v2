import { Stethoscope, Brain, Mic, CalendarCheck, UserCheck } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

export default function FeaturesSection() {
  return (
    <ul className="grid grid-cols-1 grid-rows-none gap-4 md:grid-cols-12 md:grid-rows-3 lg:gap-4 xl:max-h-[34rem] xl:grid-rows-2 max-w-[80vw]" id="features">
      <GridItem
        area="md:[grid-area:1/1/2/7] xl:[grid-area:1/1/2/5]"
        icon={<Stethoscope className="h-5 w-5 text-black" />}
        title="Smart Symptom Checker"
        description="AI-powered symptom analysis for quick, accurate health guidance and triage."
      />

      <GridItem
        area="md:[grid-area:1/7/2/13] xl:[grid-area:2/1/3/5]"
        icon={<Brain className="h-5 w-5 text-black" />}
        title="Disease Risk Prediction"
        description="Personalized risk assessments using advanced ML models for early intervention."
      />

      <GridItem
        area="md:[grid-area:2/1/3/7] xl:[grid-area:1/5/3/8]"
        icon={<Mic className="h-5 w-5 text-black" />}
        title="Voice-Enabled Clinical Notes"
        description="Automated clinical documentation with NLP and voice technology for providers."
      />

      <GridItem
        area="md:[grid-area:2/7/3/13] xl:[grid-area:1/8/2/13]"
        icon={<CalendarCheck className="h-5 w-5 text-black" />}
        title="Doctor Appointment Booking"
        description="Seamless scheduling and management of appointments within the platform."
      />

      <GridItem
        area="md:[grid-area:3/1/4/13] xl:[grid-area:2/8/3/13]"
        icon={<UserCheck className="h-5 w-5 text-black" />}
        title="Personalized Health Insights"
        description="Empowering patients and providers with actionable, AI-driven recommendations."
      />
    </ul>
  );
}

interface GridItemProps {
  area: string;
  icon: React.ReactNode;
  title: string;
  description: React.ReactNode;
}

const GridItem = ({ area, icon, title, description }: GridItemProps) => {
  return (
    <li className={`min-h-[14rem] list-none ${area}`}>
      <div className="relative h-full rounded-2xl border border-gray-400 p-2 md:rounded-3xl md:p-3 transition-transform duration-300 ease-[cubic-bezier(.4,2,.6,1)] hover:scale-[1.035] focus-visible:scale-[1.035]">
        <GlowingEffect
          blur={0}
          borderWidth={5}
          spread={80}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          variant="blue"
        />
        <div className="border-0.75 relative flex h-full flex-col justify-between gap-6 overflow-hidden rounded-xl p-6 md:p-6">
          <div className="relative flex flex-1 flex-col justify-between gap-3">
            <div className="w-fit rounded-lg border border-gray-600 p-2">
              {icon}
            </div>
            <div className="space-y-3">
              <h3 className="-tracking-4 pt-0.5 font-sans text-xl/[1.375rem] font-semibold text-balance text-black md:text-2xl/[1.875rem]">
                {title}
              </h3>
              <h2 className="font-sans text-sm/[1.125rem] text-black md:text-base/[1.375rem] [&_b]:md:font-semibold [&_strong]:md:font-semibold">
                {description}
              </h2>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};