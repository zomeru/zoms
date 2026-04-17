"use client";

import { useEffect } from "react";

import { CONSENT_STORAGE_KEY } from "@/lib/consent";

const AdSenseScript = () => {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  useEffect(() => {
    if (!clientId) return;

    const inject = () => {
      if (document.querySelector(`script[src*="adsbygoogle"]`)) return;
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    };

    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    // Inject on any decision — personalization is controlled per-ad via data-npa, not script loading
    if (consent === "accepted" || consent === "declined") {
      inject();
      return;
    }

    const handler = (e: StorageEvent) => {
      if (
        e.key === CONSENT_STORAGE_KEY &&
        (e.newValue === "accepted" || e.newValue === "declined")
      ) {
        inject();
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [clientId]);

  return null;
};

export default AdSenseScript;
