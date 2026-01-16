import FeaturesSection from "@/components/FeaturesSection";
import HeroSection from "@/components/HeroSection";
import TestimonialCards from "@/components/TestimonialCards";
import MaskingEffect from "@/components/MaskingEffect";
import WobbleFeatures from "@/components/WobbleFeatures";

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center gap-20 mb-25">
      <HeroSection />
      <FeaturesSection />
      <section className="w-full flex flex-col items-center justify-center mt-50">
        <h2 className="text-5xl font-bold text-center mb-10 bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          What Our Users Say
        </h2>
        <TestimonialCards />
      </section>
      <MaskingEffect />
      <WobbleFeatures />
    </div>
  )
}