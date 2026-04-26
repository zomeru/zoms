"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ConsentStatus } from "@/lib/consent";
import { CONSENT_STORAGE_KEY } from "@/lib/consent";

export function CookieConsent() {
  const pathname = usePathname();
  // undefined = not yet hydrated | null = hydrated, no decision | ConsentStatus = decided
  const [status, setStatus] = useState<ConsentStatus | null | undefined>(undefined);

  const isBlogOrPrivacy = pathname.startsWith("/blog") || pathname === "/privacy";

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY) as ConsentStatus | null;
    setStatus(stored); // null if never set, "accepted"/"declined" if already decided
  }, []);

  const respond = (choice: ConsentStatus) => {
    localStorage.setItem(CONSENT_STORAGE_KEY, choice);
    window.dispatchEvent(
      new StorageEvent("storage", { key: CONSENT_STORAGE_KEY, newValue: choice })
    );
    setStatus(choice);
  };

  // Show only: correct page AND hydrated (not undefined) AND no prior decision (null)
  if (!isBlogOrPrivacy || status !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed right-0 bottom-0 left-0 z-50 border-border border-t bg-surface-elevated px-4 py-4 shadow-lg sm:px-6"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary leading-relaxed">
          This site uses cookies to serve ads via Google AdSense.{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            Google&apos;s ad policy
          </a>{" "}
          ·{" "}
          <Link
            href="/privacy"
            className="text-primary underline underline-offset-2 hover:text-primary-hover"
          >
            Privacy policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => respond("declined")}
            className="rounded-md border border-border px-4 py-1.5 text-sm text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => respond("accepted")}
            className="rounded-md bg-primary px-4 py-1.5 font-medium text-sm text-white transition-colors hover:bg-primary-hover"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
