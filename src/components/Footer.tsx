"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type React from "react";
import { TITLE } from "@/constants";

const FOOTER_LINKS = ["github", "linkedin", "instagram", "contact", "privacy"] as const;
const SOCIAL_LINKS = new Set(["github", "linkedin", "instagram"]);

const Footer: React.FC = (): React.JSX.Element => {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="relative z-10 mx-auto mt-8 w-full max-w-7xl px-6 pb-28 md:px-12 md:pb-16"
    >
      <div className="flex flex-col items-start justify-between gap-6 border-border border-t pt-8 md:flex-row md:items-center">
        <div>
          <h3 className="mb-2 font-medium text-lg text-primary">
            Let&apos;s build something together
          </h3>
          <p className="mb-4 text-sm text-text-secondary">
            Feel free to reach out for collaborations or just to say hello.
          </p>
          <a
            href="mailto:zomergregorio@gmail.com"
            className="inline-flex items-center gap-2 font-mono text-primary text-sm hover:underline"
          >
            <span className="text-terminal-green">➜</span>
            <span>zomergregorio@gmail.com</span>
          </a>
        </div>

        <div className="text-sm text-text-muted">
          <div className="flex flex-col gap-1 text-left font-mono text-xs md:text-right">
            <span>
              <span className="text-secondary">const</span>{" "}
              <span className="text-terminal-green">year</span>{" "}
              <span className="text-syntax-plain">=</span>{" "}
              <span className="text-terminal-purple">{currentYear};</span>
            </span>
            <span>
              <span className="text-secondary">const</span>{" "}
              <span className="text-terminal-green">builtWith</span>{" "}
              <span className="text-syntax-plain">=</span>{" "}
              <span className="text-terminal-purple">["Next.js", "Tailwind"];</span>
            </span>
            <span>
              <span className="text-secondary">const</span>{" "}
              <span className="text-terminal-green">deployed</span>{" "}
              <span className="text-syntax-plain">=</span>{" "}
              <span className="text-terminal-purple">"Vercel";</span>
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-col items-center justify-center gap-4 border-border border-t pt-8 text-center">
        <div className="text-center font-mono text-sm text-text-muted">
          <span className="text-terminal-green">©</span>{" "}
          <Link href="/" className="transition-colors hover:text-primary">
            {TITLE}
          </Link>
          <span className="text-text-muted">{"// All rights reserved"}</span>
        </div>

        <div className="flex flex-wrap justify-center gap-6 font-mono text-sm">
          {FOOTER_LINKS.map((link) => {
            if (link === "privacy" && pathname !== "/privacy" && !pathname?.startsWith("/blog")) {
              return null;
            }

            if (SOCIAL_LINKS.has(link)) {
              return (
                <a
                  key={link}
                  href={`/${link}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-text-muted transition-colors hover:text-primary"
                >
                  {link}
                </a>
              );
            }

            return (
              <Link
                key={link}
                href={`/${link}`}
                className="text-text-muted transition-colors hover:text-primary"
              >
                {link}
              </Link>
            );
          })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
