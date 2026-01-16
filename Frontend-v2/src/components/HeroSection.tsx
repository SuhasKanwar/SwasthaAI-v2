import React from "react";
import { WavyBackground } from "@/components/ui/wavy-background";

export default function HeroSection() {
  return (
    <WavyBackground className="max-w-4xl mx-auto pb-40" backgroundFill="#f0f9fd" waveWidth={100} speed="fast">
      <p className="text-2xl md:text-4xl lg:text-7xl font-bold inter-var text-center bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
        SwasthaAI
      </p>
      <p className="text-base md:text-lg mt-4 text-gray-800 font-normal inter-var text-center">
        An intelligent healthcare platform offering smart symptom checks, risk predictions, and automated clinical support.
      </p>
    </WavyBackground>
  );
}