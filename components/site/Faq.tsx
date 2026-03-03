import { Card } from "@/components/site/UiPrimitives";

const faqs = [
  {
    q: "Is AMPÈRE an app or a website?",
    a: "Both: the app experience lives at /prototype for demos, and the website at / is informational (product, pricing, company, support).",
  },
  {
    q: "Why subscribe on the web?",
    a: "Web checkout avoids in-app store fees and keeps billing flexible. Stripe integration can be added when you’re ready.",
  },
  {
    q: "Does AMPÈRE control my TV from the browser?",
    a: "Web-only control is limited. AMPÈRE’s plan is a productized device ladder: companion pairing, local hub, and cloud fallback.",
  },
];

export default function Faq() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {faqs.map((f) => (
        <Card key={f.q}>
          <div className="text-sm font-semibold">{f.q}</div>
          <p className="mt-2 text-sm text-white/70">{f.a}</p>
        </Card>
      ))}
    </div>
  );
}