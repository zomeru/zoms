"use client";

import type React from "react";
import { useEffect, useState } from "react";

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
 * showing hours coded per language. Uses CSS-only opacity/transform animations
 * (GPU-compositable) to avoid CLS from non-composited color animations.
 * Data is passed from the server (SSR) so it's available on first paint.
 */
const WakaTimeTicker: React.FC<WakaTimeTickerProps> = ({ initialLanguages = [] }) => {
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

  useEffect(() => {
    if (languages.length === 0) return;
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, [languages.length]);

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
        transition: "opacity 600ms ease-out, transform 600ms ease-out",
        contain: "layout style"
      }}
    >
      <div className="flex h-6 items-end justify-end gap-1 overflow-hidden">
        <span className="font-medium text-2xl text-terminal-green tabular-nums leading-none">
          {current.hours.toLocaleString()}
        </span>
        <span className="mb-0.5 font-medium text-sm text-terminal-green leading-none">hrs</span>
      </div>

      <div
        className="mt-0.5 h-4 text-terminal-green text-xs tracking-wide"
        style={{
          opacity: labelVisible ? 0.75 : 0,
          transition: "opacity 350ms ease-in-out"
        }}
      >
        {current.name}
      </div>
    </div>
  );
};

export default WakaTimeTicker;
