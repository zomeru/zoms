import Script from "next/script";
import type React from "react";

export default function BlogLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  return (
    <>
      {clientId && (
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      )}
      {children}
    </>
  );
}
