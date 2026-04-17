import type React from "react";
import { AdSenseScript } from "@/components/ui";

export default function BlogLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <div className="pt-24 md:pt-32">
      <AdSenseScript />
      {children}
    </div>
  );
}
