"use client";

import { useEffect, useRef, useState } from "react";

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
  const initialized = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      setLoaded(true);
    } catch {
      // AdSense script not yet loaded
    }
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

  if (!clientId || !slot || !loaded) return null;

  return (
    <div className={className}>
      <ins
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
