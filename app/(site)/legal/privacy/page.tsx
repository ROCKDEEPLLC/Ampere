import Section from "@/components/site/Section";
import { Card } from "@/components/site/UiPrimitives";

export default function PrivacyPage() {
  return (
    <div>
      <Section
        eyebrow="Legal"
        title="Privacy Policy (Draft)"
        subtitle="Replace this draft with your final legal text when ready."
      >
        <Card>
          <p className="text-sm text-white/70">
            AMPÈRE is designed to be local-first by default. Your profile and taste
            data can live on-device, with optional sync features later.
          </p>
          <p className="mt-3 text-sm text-white/70">
            This page is a placeholder for formal policy text.
          </p>
        </Card>
      </Section>
    </div>
  );
}