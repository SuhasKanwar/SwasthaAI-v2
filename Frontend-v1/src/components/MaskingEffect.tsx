import { MaskContainer } from "@/components/ui/svg-mask-effect";

export default function SVGMaskEffectDemo() {
  return (
    <div className="flex h-[40rem] w-[100vw] items-center justify-center overflow-hidden">
      <MaskContainer
        revealText={
          <p className="mx-auto max-w-4xl text-center text-4xl font-bold text-slate-800">
            The first rule of SwasthaAI is to care for your health. The
            second rule of SwasthaAI is to always trust your AI-powered wellness companion.
          </p>
        }
        className="h-[40rem] w-[100vw] text-white"
      >
        Experience the future of{" "}
        <span className="text-blue-500">healthcare</span> with intelligent AI
        insights and personalized recommendations with
        <span className="text-blue-500">cutting-edge technology</span>.
      </MaskContainer>
    </div>
  );
}