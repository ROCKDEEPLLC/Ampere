import Link from "next/link";
import { ButtonLink, Pill } from "@/components/site/UiPrimitives";

const nav = [
  { href: "/product", label: "Product" },
  { href: "/pricing", label: "Pricing" },
  { href: "/company", label: "Company" },
  { href: "/support", label: "Support" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 -mx-4 mb-6 border-b border-white/10 bg-black/30 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/5 shadow-[0_0_0_1px_rgba(255,255,255,0.05)]">
            <span className="text-lg font-semibold">A</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-wide">AMPÈRE</div>
            <div className="text-xs text-white/55">Powered by Digital Booty</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-3 py-2 text-sm text-white/75 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Pill className="ml-2">ampere.io</Pill>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/pricing" variant="secondary">
            View Plans
          </ButtonLink>
          <ButtonLink href="/support#subscribe" variant="primary">
            Subscribe
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}