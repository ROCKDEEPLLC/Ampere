import { Pill } from "@/components/site/UiPrimitives";

export default function LogosRow() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-white/55">
          Works as a universal layer across your services (concept + roadmap)
        </div>
        <div className="flex flex-wrap gap-2">
          <Pill>Netflix</Pill>
          <Pill>YouTube</Pill>
          <Pill>Disney+</Pill>
          <Pill>Prime Video</Pill>
          <Pill>Hulu</Pill>
          <Pill>Sports</Pill>
        </div>
      </div>
    </div>
  );
}