import Section from "@/components/site/Section";
import { Card } from "@/components/site/UiPrimitives";

export default function TermsPage() {
  return (
    <div>
      <Section
        eyebrow="Legal"
        title="Terms of Service (Draft)"
        subtitle="Replace this draft with your final legal text when ready."
      >
        <Card>
          <p className="text-sm text-white/70">
            These terms are a placeholder. Once payments and accounts are enabled,
            you’ll want formal terms covering subscriptions, cancellation, and usage.
          </p>
        </Card>
      </Section>
    </div>
  );
}