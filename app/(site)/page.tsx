import Section from "@/components/site/Section";
import { ButtonLink, Card, Pill } from "@/components/site/UiPrimitives";
import LogosRow from "@/components/site/LogosRow";
import Faq from "@/components/site/Faq";

export default function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="pt-8 md:pt-14">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap gap-2">
              <Pill>Taste Engine</Pill>
              <Pill>Universal Queue</Pill>
              <Pill>Time-to-Delight</Pill>
              <Pill>Integration Ladder</Pill>
            </div>
            <h1 className="mt-5 text-4xl font-semibold leading-tight md:text-5xl">
              AMPÈRE is the <span className="text-white/80">Universal TV OS</span>{" "}
              — built around taste, trust, and time.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/70 md:text-lg">
              Not another streaming app. AMPÈRE is a new interface layer: it
              learns your taste, explains every recommendation, and helps you
              decide what to watch based on time, mood, and live context.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <ButtonLink href="/pricing" variant="primary">
                See Pricing
              </ButtonLink>
              <ButtonLink href="/product" variant="secondary">
                Explore Features
              </ButtonLink>
              <ButtonLink href="/support#subscribe" variant="ghost">
                Subscribe (Web Checkout)
              </ButtonLink>
            </div>

            <p className="mt-4 text-xs text-white/45">
              Note: Web subscription is planned to avoid in-app fees. Checkout
              integration can be added via Stripe when you’re ready.
            </p>
          </div>

          <div className="w-full max-w-md">
            <Card className="p-6">
              <div className="text-sm font-semibold">Signature mechanic</div>
              <p className="mt-2 text-sm text-white/70">
                “I have 22 minutes and want something intense.”
              </p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="text-xs text-white/60">AMPÈRE responds</div>
                <div className="mt-2 text-sm">
                  Picks the best match across your services, explains why, and
                  queues it — instantly.
                </div>
              </div>
              <div className="mt-5 flex gap-2">
                <Pill>Explainability</Pill>
                <Pill>Controls</Pill>
                <Pill>Novelty</Pill>
              </div>
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <LogosRow />
        </div>
      </section>

      {/* RAILS (informational cards that look like the app) */}
      <Section
        eyebrow="Designed like a home screen"
        title="A website that feels like the AMPÈRE interface"
        subtitle="Same DNA, but informational: product, company, pricing, and web subscription."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <div className="text-sm font-semibold">Taste Engine</div>
            <p className="mt-2 text-sm text-white/70">
              Controls, explainability, portability, and a visible “taste map.”
            </p>
            <div className="mt-4 flex gap-2">
              <Pill>More / Less</Pill>
              <Pill>Mute topics</Pill>
              <Pill>Because…</Pill>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Universal Queue</div>
            <p className="mt-2 text-sm text-white/70">
              One watchlist that resolves availability and survives platform
              changes.
            </p>
            <div className="mt-4 flex gap-2">
              <Pill>Preferred</Pill>
              <Pill>Alternates</Pill>
              <Pill>Notify</Pill>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Add Device</div>
            <p className="mt-2 text-sm text-white/70">
              Productized TV connection path: companion pairing, local hub, or
              cloud fallback.
            </p>
            <div className="mt-4 flex gap-2">
              <Pill>QR Pairing</Pill>
              <Pill>Hub</Pill>
              <Pill>Fallback</Pill>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/product" variant="secondary">
            See the full feature stack
          </ButtonLink>
          <ButtonLink href="/pricing" variant="primary">
            Choose a plan
          </ButtonLink>
        </div>
      </Section>

      <Section
        eyebrow="Trust as a feature"
        title="Local-first by default"
        subtitle="AMPÈRE treats privacy and portability as part of the product, not a settings screen."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="text-sm font-semibold">Your profile lives on-device</div>
            <p className="mt-2 text-sm text-white/70">
              Default experience stores taste locally, with optional sync later.
            </p>
          </Card>
          <Card>
            <div className="text-sm font-semibold">Export / Import taste</div>
            <p className="mt-2 text-sm text-white/70">
              Make your taste portable: export profile + events and move between
              devices.
            </p>
          </Card>
        </div>
      </Section>

      <Section
        eyebrow="FAQ"
        title="Questions people actually ask"
        subtitle="Clear answers, no hype. When you’re ready, we’ll wire in Stripe web checkout."
      >
        <Faq />
      </Section>
    </div>
  );
}