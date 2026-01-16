import React from "react";
import { WobbleCard } from "@/components/ui/wobble-card";
import { MdHealthAndSafety, MdOutlineSupportAgent } from "react-icons/md";
import { AiOutlineRobot } from "react-icons/ai";

export default function WobbleFeatures() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full" id="benefits">
      <WobbleCard
        containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 min-h-[500px] lg:min-h-[300px]"
        className=""
      >
        <div className="max-w-xs flex flex-col gap-4">
          <MdHealthAndSafety size={48} className="text-white" />
          <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            Your Health, Our Priority
          </h2>
          <p className="mt-2 text-left text-base/6 text-neutral-200">
            SwasthaAI leverages advanced AI to provide personalized health insights
            and recommendations, empowering you to take charge of your well-being.
          </p>
        </div>
      </WobbleCard>
      <WobbleCard containerClassName="col-span-1 min-h-[300px]">
        <div className="flex flex-col gap-4">
          <AiOutlineRobot size={48} className="text-white" />
          <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            AI-Powered Symptom Checker
          </h2>
          <p className="mt-2 max-w-[26rem] text-left text-base/6 text-neutral-200">
            Instantly analyze your symptoms and get reliable guidance with our
            intelligent AI assistant, available 24/7.
          </p>
        </div>
      </WobbleCard>
      <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
        <div className="max-w-sm flex flex-col gap-4">
          <MdOutlineSupportAgent size={48} className="text-white" />
          <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
            Connect with Health Experts
          </h2>
          <p className="mt-2 max-w-[26rem] text-left text-base/6 text-neutral-200">
            Get expert advice and support from certified professionals, ensuring
            you always have access to trusted healthcare guidance.
          </p>
        </div>
      </WobbleCard>
    </div>
  );
}