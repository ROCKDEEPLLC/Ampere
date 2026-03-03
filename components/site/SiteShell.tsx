export default function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#07090d] text-white">
      {/* Subtle glow + vignette */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(58,132,255,0.20),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_30%_at_15%_20%,rgba(0,255,209,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_30%_at_85%_35%,rgba(143,0,255,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_120%,rgba(0,0,0,0.85),rgba(0,0,0,0.92))]" />
      </div>

      {/* Page container */}
      <div className="mx-auto w-full max-w-6xl px-4 pb-16">{children}</div>
    </div>
  );
}