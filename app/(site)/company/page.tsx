import Section from "@/components/site/Section";
import { Card, Pill } from "@/components/site/UiPrimitives";

export default function CompanyPage() {
  return (
    <div>
      <Section
        eyebrow="Company"
        title="AMPÈRE, powered by Digital Booty"
        subtitle="AMPÈRE is a product vision and interface layer for TV experiences: personalization people believe, and controls people can explain."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="text-sm font-semibold">Mission</div>
            <p className="mt-2 text-sm text-white/70">
              Make TV feel coherent again: one place to discover, decide, queue,
              and continue—across platforms and devices.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Pill>Taste</Pill>
              <Pill>Trust</Pill>
              <Pill>Time</Pill>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Product philosophy</div>
            <p className="mt-2 text-sm text-white/70">
              AMPÈRE favors explainability, user control, and novelty—so “For You”
              actually feels personal.
            </p>
          </Card>
        </div>
      </Section>
    </div>
  );
}