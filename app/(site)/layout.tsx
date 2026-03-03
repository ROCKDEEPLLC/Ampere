import type { Metadata } from "next";
import "@/app/globals.css";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import SiteShell from "@/components/site/SiteShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://ampere.io"),
  title: {
    default: "AMPÈRE — The Universal TV OS",
    template: "%s — AMPÈRE",
  },
  description:
    "AMPÈRE is a universal TV operating system concept: taste engine personalization, universal queue, time-to-delight modes, and an integration ladder for connected platforms.",
  openGraph: {
    title: "AMPÈRE — The Universal TV OS",
    description:
      "Taste Engine personalization, Universal Queue, Time-to-Delight modes, and a modern integration ladder.",
    url: "https://ampere.io",
    siteName: "AMPÈRE",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SiteShell>
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </SiteShell>
      </body>
    </html>
  );
}