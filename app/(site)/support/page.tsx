import Section from "@/components/site/Section";
import { Card, ButtonLink } from "@/components/site/UiPrimitives";

export default function SupportPage() {
  return (
    <div>
      <Section
        eyebrow="Support"
        title="Help, access, and web subscription"
        subtitle="This page is designed to become the hub for support, account access, and checkout."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <div className="text-sm font-semibold">Contact</div>
            <p className="mt-2 text-sm text-white/70">
              Add your support email + links here when ready.
            </p>
            <p className="mt-3 text-xs text-white/45">
              (We can wire a contact form later using Resend or Formspree.)
            </p>
          </Card>

          <Card>
            <div className="text-sm font-semibold">Account</div>
            <p className="mt-2 text-sm text-white/70">
              Sign-in/Sign-up and billing portal links will live here once
              authentication and Stripe are connected.
            </p>
          </Card>
        </div>

        <div id="subscribe" className="mt-8">
          <Card className="p-6">
            <div className="text-sm font-semibold">Subscribe on the web</div>
            <p className="mt-2 text-sm text-white/70">
              This will become the Stripe Checkout entry point to avoid in-app
              store fees. For now, it’s a placeholder button.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <ButtonLink href="/pricing" variant="secondary">
                View Plans
              </ButtonLink>
              <ButtonLink href="/pricing" variant="primary">
                Subscribe (Placeholder)
              </ButtonLink>
            </div>
            <p className="mt-3 text-xs text-white/45">
              When you’re ready, we’ll implement Stripe Checkout + success/cancel routes.
            </p>
          </Card>
        </div>
      </Section>
    </div>
  );
}