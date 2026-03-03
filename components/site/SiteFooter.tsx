import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-white/10 pt-10">
      <div className="grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-sm font-semibold">AMPÈRE</div>
          <div className="mt-1 text-sm text-white/65">
            Powered by Digital Booty
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-white/60">
            AMPÈRE is building a universal TV experience: a taste engine with
            explainability, a universal queue that survives availability changes,
            time-to-delight modes, and a productized integration ladder.
          </p>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-widest text-white/55">
            PAGES
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <Link className="text-white/70 hover:text-white" href="/product">
              Product
            </Link>
            <Link className="text-white/70 hover:text-white" href="/pricing">
              Pricing
            </Link>
            <Link className="text-white/70 hover:text-white" href="/company">
              Company
            </Link>
            <Link className="text-white/70 hover:text-white" href="/support">
              Support
            </Link>
          </div>
        </div>

        <div>
          <div className="text-xs font-semibold tracking-widest text-white/55">
            LEGAL
          </div>
          <div className="mt-3 grid gap-2 text-sm">
            <Link
              className="text-white/70 hover:text-white"
              href="/legal/privacy"
            >
              Privacy
            </Link>
            <Link className="text-white/70 hover:text-white" href="/legal/terms">
              Terms
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-2 border-t border-white/10 py-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
        <div>© {new Date().getFullYear()} AMPÈRE — Powered by Digital Booty</div>
        <div>Domain: ampere.io</div>
      </div>
    </footer>
  );
}