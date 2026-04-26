"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

const ChatAssistantShell = dynamic(
  async () =>
    await import("@/components/ai/ChatAssistantShell").then((module) => module.ChatAssistantShell),
  {
    ssr: false
  }
);

const ParticleBackground = dynamic(
  async () =>
    await import("@/components/ParticleBackground").then((module) => module.ParticleBackground),
  {
    ssr: false
  }
);

export function GlobalEnhancements() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <ParticleBackground />
      <ChatAssistantShell />
    </>
  );
}
