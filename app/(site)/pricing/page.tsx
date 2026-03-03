import Section from "@/components/site/Section";
import PricingTable from "@/components/site/PricingTable";
import { Card } from "@/components/site/UiPrimitives";

export default function PricingPage() {
  return (
    <div>
      <Section
        eyebrow="Pricing"
        title="Plans for every household"
        subtitle="These are the plan structures and entitlements you outlined. When you’re ready, we’ll wire the Subscribe buttons to Stripe Checkout."
      >
        <PricingTable />

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Card>
            <div className="text-sm font-semibold">Web subscription (recommended)</div>
            <p className="mt-2 text-sm text-white/70">
              Checkout will run on ampere.io so payments don’t go through the app
              store. Stripe is the usual approach.
            </p>
          </Card>
          <Card>
            <div className="text-sm font-semibold">Billing implementation note</div>
            <p className="mt-2 text-sm text-white/70">
              For now this page is informational. When you approve, we’ll add:
              plans in Stripe, success/cancel routes, and a lightweight account
              record for entitlement.
            </p>
          </Card>
        </div>
      </Section>
    </div>
  );
}