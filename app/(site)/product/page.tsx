import Section from "@/components/site/Section";
import { Card, Pill, ButtonLink } from "@/components/site/UiPrimitives";

export default function ProductPage() {
  return (
    <div>
      <Section
        eyebrow="Product"
        title="The AMPÈRE Feature Stack"
        subtitle="A universal TV OS concept built from four pillars: Taste Engine, Universal Queue, Time-to-Delight, and the Integration Ladder."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="text-sm font-semibold">A) Taste Engine</div>
            <p className="mt-2 text-sm text-white/70">
              Explainable recommendations with user controls: More/Less like this,
              prioritize comfort vs discovery, and mute topics.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Why this?</Pill>
              <Pill>Taste Map</Pill>
              <Pill>Discovery Contracts</Pill>
              <Pill>Export / Import</Pill>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">B) Universal Queue</div>
            <p className="mt-2 text-sm text-white/70">
              A watchlist that resolves availability: preferred platform, alternates,
              and “notify when free / live / on favorite service.”
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Availability-aware</Pill>
              <Pill>Deep links</Pill>
              <Pill>Durable watchlist</Pill>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">C) Time-to-Delight</div>
            <p className="mt-2 text-sm text-white/70">
              Intent-first playback: “I have 22 minutes” becomes a curated queue with
              explanations and controls.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Exact-fit picks</Pill>
              <Pill>Context modes</Pill>
              <Pill>Remote macros</Pill>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">D) Integration Ladder</div>
            <p className="mt-2 text-sm text-white/70">
              Productized steps from demo handoff to real integrations:
              identity, entitlements, deep links, watch-state sync.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Level 1: Deep link</Pill>
              <Pill>Level 2: OAuth</Pill>
              <Pill>Level 3: Watch state</Pill>
            </div>
          </Card>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <ButtonLink href="/pricing" variant="primary">
            View Pricing
          </ButtonLink>
          <ButtonLink href="/support" variant="secondary">
            Contact + Subscribe
          </ButtonLink>
        </div>
      </Section>
    </div>
  );
}