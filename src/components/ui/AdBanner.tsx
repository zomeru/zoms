"use client";

import { useEffect, useRef } from "react";

import { CONSENT_STORAGE_KEY } from "@/lib/consent";

interface AdBannerProps {
  slot: string;
  format?: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: Record<string, unknown>[];
  }
}

const AdBanner = ({ slot, format = "auto", className }: AdBannerProps) => {
  const insRef = useRef<HTMLModElement>(null);

  useEffect(() => {
    const tryInit = () => {
      const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
      // No decision yet — wait for user to respond
      if (!consent) return;
      const ins = insRef.current;
      if (!ins) return;
      // Skip if AdSense already filled this element (SPA navigation guard)
      if (ins.dataset.adsbygoogleStatus) return;
      // Non-personalized ads when user declined
      if (consent === "declined") {
        ins.setAttribute("data-npa", "1");
      }
      try {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      } catch {
        // AdSense script not yet loaded
      }
    };

    tryInit();

    const handler = (e: StorageEvent) => {
      if (e.key === CONSENT_STORAGE_KEY) tryInit();
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  if (process.env.NODE_ENV === "development") {
    return (
      <div
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "90px",
          border: "1px dashed #555",
          borderRadius: "6px",
          color: "#888",
          fontFamily: "monospace",
          fontSize: "12px"
        }}
      >
        Ad placeholder — slot: {slot}
      </div>
    );
  }

  if (!clientId || !slot) return null;

  return (
    <div className={className}>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdBanner;
