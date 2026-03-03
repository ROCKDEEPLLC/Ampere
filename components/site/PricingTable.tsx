import { Card, Pill, ButtonLink } from "@/components/site/UiPrimitives";

type Plan = {
  name: string;
  price: string;
  blurb: string;
  bullets: string[];
  tag?: string;
};

const plans: Plan[] = [
  {
    name: "Pro",
    price: "$— / mo",
    blurb: "Core AMPÈRE experience.",
    bullets: ["Up to 3 user profiles", "Taste controls + explainability", "Universal Queue (basic)"],
  },
  {
    name: "Premium",
    price: "$— / mo",
    blurb: "Full personalization + expansion.",
    tag: "Most Popular",
    bullets: [
      "Unlimited regional streaming platform/channel options",
      "Additional AMPÈRE features free for a year",
      "Advanced Taste Engine controls",
    ],
  },
  {
    name: "Family",
    price: "$— / mo",
    blurb: "Multi-profile household setup.",
    bullets: [
      "Multi-profile support",
      "Two regional streaming platform/channel options",
      "Add $0.99/month per additional user profile",
    ],
  },
  {
    name: "Ala-Carte",
    price: "From $2.99 / mo",
    blurb: "Pick what you need.",
    bullets: [
      "Solo Plan: $2.99/mo for 1 user profile",
      "Everything in Pro Plan",
      "Family Add-On: $0.99/mo per additional profile",
    ],
  },
  {
    name: "Game Day Sports Betting",
    price: "$— / mo",
    blurb: "Manual bet tracking companion (no wager placement).",
    bullets: [
      "One-tap Add Bet from any game card",
      "Bets Drawer always available + badge count",
      "Paste-to-add bet slip parsing",
      "P/L tracking + reminders + export tools",
    ],
  },
];

export default function PricingTable() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((p) => (
        <Card key={p.name} className="relative">
          {p.tag ? (
            <div className="absolute right-4 top-4">
              <Pill className="bg-white/10">{p.tag}</Pill>
            </div>
          ) : null}
          <div className="text-sm font-semibold">{p.name}</div>
          <div className="mt-2 text-2xl font-semibold">{p.price}</div>
          <p className="mt-2 text-sm text-white/70">{p.blurb}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            {p.bullets.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="mt-[2px] inline-block h-4 w-4 rounded-full bg-white/10" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <ButtonLink href="/support#subscribe" variant="primary">
              Subscribe
            </ButtonLink>
            <ButtonLink href="/product" variant="secondary">
              Details
            </ButtonLink>
          </div>
          <p className="mt-3 text-xs text-white/45">
            Subscription is planned via web checkout to avoid in-app fees.
          </p>
        </Card>
      ))}
    </div>
  );
}