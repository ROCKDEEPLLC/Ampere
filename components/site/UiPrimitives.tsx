import Link from "next/link";

export function Pill({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={[
        "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90"
      : variant === "secondary"
        ? "bg-white/10 text-white hover:bg-white/15 border border-white/10"
        : "text-white/80 hover:text-white";
  return (
    <Link href={href} className={[base, styles, className].join(" ")}>
      {children}
    </Link>
  );
}