import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";

import { TerminalCard } from "@/components/ui";
import { SITE_URL } from "@/configs/seo";
import { TITLE } from "@/constants";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${TITLE}.`,
  alternates: {
    canonical: `${SITE_URL}/contact`
  }
};

const ContactPage: React.FC = (): React.JSX.Element => {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 pt-24 pb-16 md:px-12 md:pt-32">
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

        <TerminalCard title="contact.ts" bodyClassName="p-8">
          <h1 className="mb-4 font-semibold text-3xl text-primary md:text-4xl">Contact</h1>
          <p className="font-mono text-sm text-text-secondary">
            <span className="text-secondary">const</span>{" "}
            <span className="text-terminal-green">vibe</span>{" "}
            <span className="text-syntax-plain">=</span>{" "}
            <span className="text-terminal-purple">"Let&apos;s build something great";</span>
          </p>
        </TerminalCard>
      </div>

      <div className="rounded-lg border border-code-border bg-code-bg px-8 py-8 font-mono">
        <p className="mb-6 text-sm text-text-secondary leading-relaxed">
          Open to collaborations, freelance work, or just a friendly hello. Best way to reach me:
        </p>

        <div className="mb-8 flex flex-col gap-3">
          <a
            href="mailto:zomergregorio@gmail.com"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <span className="text-terminal-green">➜</span>
            <span className="text-primary">email</span>
            <span className="text-text-muted">{"//"}</span>
            <span className="text-text-secondary">zomergregorio@gmail.com</span>
          </a>
          <a
            href="/linkedin"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <span className="text-terminal-green">➜</span>
            <span className="text-primary">linkedin</span>
            <span className="text-text-muted">{"//"}</span>
            <span className="text-text-secondary">zomergregorio</span>
          </a>
          <a
            href="/github"
            className="inline-flex items-center gap-2 text-sm transition-colors hover:text-primary"
          >
            <span className="text-terminal-green">➜</span>
            <span className="text-primary">github</span>
            <span className="text-text-muted">{"//"}</span>
            <span className="text-text-secondary">zomeru</span>
          </a>
        </div>

        <p className="text-text-muted text-xs">
          <span className="text-terminal-green">{"//"} </span>
          Response time is usually within 24–48 hours.
        </p>
      </div>
    </div>
  );
};

export default ContactPage;
