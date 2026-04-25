import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { AdBanner, AdSenseScript, TerminalCard } from "@/components/ui";
import { SITE_URL } from "@/configs/seo";
import { TITLE } from "@/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `Privacy Policy for ${TITLE}'s portfolio and blog.`,
  alternates: {
    canonical: `${SITE_URL}/privacy`
  }
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 font-semibold text-lg text-primary">{title}</h2>
      <div className="space-y-3 font-mono text-sm text-text-secondary leading-relaxed">
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  const lastUpdated = "April 17, 2026";

  return (
    <div className="mx-auto max-w-7xl px-6 pt-24 pb-16 md:px-12 md:pt-32">
      <AdSenseScript />
      <div className="mb-12">
        <Link
          href="/blog"
          className="mb-8 inline-flex items-center gap-2 font-mono text-primary text-sm hover:underline"
        >
          <span className="text-terminal-green">cd</span>
          <span className="text-text-secondary">..</span>
          <span className="text-primary">→</span>
          <span>blog</span>
        </Link>

        <TerminalCard title="privacy.md" bodyClassName="p-8">
          <h1 className="mb-2 font-semibold text-3xl text-primary md:text-4xl">Privacy Policy</h1>
          <p className="font-mono text-text-muted text-xs">Last updated: {lastUpdated}</p>
        </TerminalCard>
      </div>

      <AdBanner slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_PRIVACY ?? ""} className="mb-8" />

      <div className="rounded-lg border border-code-border bg-code-bg px-8 py-8">
        <Section title="Overview">
          <p>
            This Privacy Policy describes how {TITLE} (&quot;I&quot;, &quot;me&quot;) collects,
            uses, and shares information when you visit this website, including the blog section.
          </p>
        </Section>

        <Section title="Information Collected">
          <p>
            <span className="text-terminal-green">{"//"} Analytics</span>
          </p>
          <p>
            This site uses{" "}
            <a
              href="https://vercel.com/docs/analytics"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vercel Analytics
            </a>{" "}
            and{" "}
            <a
              href="https://vercel.com/docs/speed-insights"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Vercel Speed Insights
            </a>{" "}
            to collect anonymous, aggregated traffic data. No personally identifiable information is
            stored. No cookies are set by these services.
          </p>
          <p>
            <span className="text-terminal-green">{"//"} Advertising</span>
          </p>
          <p>
            The blog section displays ads served by{" "}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google AdSense
            </a>
            . Google may use cookies to serve ads based on your prior visits to this or other
            websites. You can opt out of personalized advertising by visiting{" "}
            <a
              href="https://adssettings.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Ads Settings
            </a>
            .
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            The portfolio section of this site sets no cookies. The blog section uses cookies only
            after you explicitly accept via the consent banner. These cookies are set by Google
            AdSense to serve personalized ads. You may decline consent at any time —
            non-personalized ads will be shown instead.
          </p>
          <p>
            You can also opt out via the{" "}
            <a
              href="https://optout.networkadvertising.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              NAI opt-out tool
            </a>{" "}
            or{" "}
            <a
              href="https://www.youronlinechoices.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Your Online Choices
            </a>
            .
          </p>
        </Section>

        <Section title="Third-Party Links">
          <p>
            This site may link to external websites. I am not responsible for the privacy practices
            of those sites.
          </p>
        </Section>

        <Section title="Data Retention">
          <p>
            I do not store any personal data on my own servers. Vercel Analytics retains anonymized
            data per their own retention policy. Google AdSense data is governed by{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Questions about this policy? Reach out at{" "}
            <a href="mailto:zomergregorio@gmail.com" className="text-primary hover:underline">
              zomergregorio@gmail.com
            </a>
            .
          </p>
        </Section>
      </div>
    </div>
  );
}
