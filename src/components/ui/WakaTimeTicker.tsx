"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { AnimatedCounter } from "react-animated-counter";

interface Language {
  name: string;
  hours: number;
}

interface WakaTimeTickerProps {
  initialLanguages?: Language[];
}

/**
 * WakaTimeTicker
 *
 * Fixed top-right badge that cycles through WakaTime languages one at a time,
 * showing hours coded per language. Inspired by vexp.dev's top-right token counter.
 * Uses react-animated-counter for Robinhood-style rolling digit animation.
 * Data is passed from the server (SSR) so it's available on first paint.
 */
const WakaTimeTicker: React.FC<WakaTimeTickerProps> = ({ initialLanguages = [] }) => {
  // Initialize without shuffle so server and client render the same HTML (no hydration mismatch).
  // Shuffle happens client-side in useEffect, before the 50ms entrance delay fires.
  const [languages, setLanguages] = useState<Language[]>(() =>
    initialLanguages.filter((l) => l.hours >= 1)
  );

  useEffect(() => {
    setLanguages((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, []);

  const [index, setIndex] = useState(0);
  const [labelVisible, setLabelVisible] = useState(true);
  const [show, setShow] = useState(false);

  // Entrance animation — trigger after mount so the transition plays on first paint
  useEffect(() => {
    if (languages.length === 0) return;
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, [languages.length]);

  // Advance language in sync with the NodeSection's node-cycle event.
  // The label fades out, index advances, then fades back in.
  useEffect(() => {
    if (languages.length < 2) return;

    const handleCycle = () => {
      setLabelVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % languages.length);
        setLabelVisible(true);
      }, 350);
    };

    window.addEventListener("node-cycle", handleCycle);
    return () => window.removeEventListener("node-cycle", handleCycle);
  }, [languages.length]);

  if (languages.length === 0) return null;
  const current = languages[index];

  return (
    <div
      className="pointer-events-none fixed top-4 right-5 z-40 select-none text-right font-mono"
      aria-hidden="true"
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translateY(0)" : "translateY(-6px)",
        transition: "opacity 600ms ease-out, transform 600ms ease-out"
      }}
    >
      {/* Number row — react-animated-counter rolls digits between values */}
      <div className="flex items-end justify-end gap-1">
        <AnimatedCounter
          value={current.hours}
          fontSize="24px"
          color="var(--color-terminal-green)"
          incrementColor="var(--color-terminal-green)"
          decrementColor="var(--color-terminal-green)"
          includeDecimals={false}
          includeCommas
          containerStyles={{ fontFamily: "inherit", fontWeight: 500, lineHeight: 1 }}
        />
        <span className="mb-0.5 font-medium text-sm text-terminal-green leading-none">hrs</span>
      </div>

      {/* Language label — fades between languages */}
      <div
        className="mt-0.5 text-terminal-green text-xs tracking-wide transition-opacity duration-350 ease-in-out"
        style={{ opacity: labelVisible ? 0.75 : 0 }}
      >
        {current.name}
      </div>
    </div>
  );
};

export default WakaTimeTicker;
