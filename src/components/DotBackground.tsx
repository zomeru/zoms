"use client";

import { useEffect, useRef } from "react";

import { readThemeVisualTokens, THEME_CHANGE_EVENT } from "@/lib/theme/dom";

const DOT_SPACING = 30;
const DOT_RADIUS = 1.7;
const REVEAL_RADIUS = 220;

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        Number.parseInt(result[1], 16),
        Number.parseInt(result[2], 16),
        Number.parseInt(result[3], 16)
      ]
    : [59, 130, 246];
}

const DotBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const targetMouseRef = useRef({ x: -9999, y: -9999 });
  const isVisibleRef = useRef(true);
  const dotColorRef = useRef<[number, number, number]>([59, 130, 246]);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const syncTheme = () => {
      const tokens = readThemeVisualTokens();
      dotColorRef.current = hexToRgb(tokens.particle2);
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      if (!isVisibleRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const mouse = mouseRef.current;
      const target = targetMouseRef.current;

      // Smooth interpolation
      mouse.x += (target.x - mouse.x) * 0.15;
      mouse.y += (target.y - mouse.y) * 0.15;

      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      // Skip drawing if mouse is off-screen
      if (mouse.x < -REVEAL_RADIUS || mouse.y < -REVEAL_RADIUS) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const [r, g, b] = dotColorRef.current;
      const revealSq = REVEAL_RADIUS * REVEAL_RADIUS;

      // Only iterate dots near the mouse for performance
      const startCol = Math.max(0, Math.floor((mouse.x - REVEAL_RADIUS) / DOT_SPACING));
      const endCol = Math.min(
        Math.ceil(w / DOT_SPACING),
        Math.ceil((mouse.x + REVEAL_RADIUS) / DOT_SPACING)
      );
      const startRow = Math.max(0, Math.floor((mouse.y - REVEAL_RADIUS) / DOT_SPACING));
      const endRow = Math.min(
        Math.ceil(h / DOT_SPACING),
        Math.ceil((mouse.y + REVEAL_RADIUS) / DOT_SPACING)
      );

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const x = col * DOT_SPACING;
          const y = row * DOT_SPACING;
          const dx = x - mouse.x;
          const dy = y - mouse.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < revealSq) {
            const dist = Math.sqrt(distSq);
            const opacity = Math.max(0, 1 - dist / REVEAL_RADIUS);
            const eased = opacity * opacity;

            ctx.beginPath();
            ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r},${g},${b},${eased * 0.8})`;
            ctx.fill();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    syncTheme();
    resize();
    rafRef.current = requestAnimationFrame(draw);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      targetMouseRef.current = { x: -9999, y: -9999 };
    };

    const handleResize = () => {
      resize();
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      io.disconnect();
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-0 block h-full w-full" />
  );
};

export default DotBackground;
