"use client";

import { useEffect, useRef } from "react";

import { readThemeVisualTokens, THEME_CHANGE_EVENT } from "@/lib/theme/dom";

const PARTICLE_COUNT = 70;
const LINK_DISTANCE = 140;
const LINK_OPACITY = 0.15;
const REPULSE_DISTANCE = 140;
const PARTICLE_SPEED = 0.3;
const FPS_INTERVAL = 1000 / 60;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  colorIndex: number;
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        Number.parseInt(result[1], 16),
        Number.parseInt(result[2], 16),
        Number.parseInt(result[3], 16)
      ]
    : [139, 92, 246];
}

function parseRgba(rgba: string): [number, number, number] {
  const match = rgba.match(/(\d+)/g);
  return match ? [Number(match[0]), Number(match[1]), Number(match[2])] : [148, 163, 184];
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const colorsRef = useRef<[number, number, number][]>([
    [139, 92, 246],
    [59, 130, 246],
    [99, 102, 241]
  ]);
  const linkColorRef = useRef<[number, number, number]>([148, 163, 184]);
  const lastFrameRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const syncTheme = () => {
      const tokens = readThemeVisualTokens();
      colorsRef.current = [
        hexToRgb(tokens.particle1),
        hexToRgb(tokens.particle2),
        hexToRgb(tokens.particle3)
      ];
      linkColorRef.current = parseRgba(tokens.nodeLink);
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

    const initParticles = () => {
      const { w, h } = sizeRef.current;
      particlesRef.current = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
        vy: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
        size: 1 + Math.random() * 2,
        colorIndex: Math.floor(Math.random() * 3)
      }));
    };

    const draw = (timestamp: number) => {
      const elapsed = timestamp - lastFrameRef.current;
      if (elapsed < FPS_INTERVAL) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      lastFrameRef.current = timestamp - (elapsed % FPS_INTERVAL);

      const { w, h } = sizeRef.current;
      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Update positions
      for (const p of particles) {
        // Mouse repulse
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPULSE_DISTANCE && dist > 0) {
          const force = (REPULSE_DISTANCE - dist) / REPULSE_DISTANCE;
          p.vx += (dx / dist) * force * 0.8;
          p.vy += (dy / dist) * force * 0.8;
        }

        // Dampen velocity
        p.vx *= 0.98;
        p.vy *= 0.98;

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > PARTICLE_SPEED * 3) {
          p.vx = (p.vx / speed) * PARTICLE_SPEED * 3;
          p.vy = (p.vy / speed) * PARTICLE_SPEED * 3;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Bounce
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        p.x = Math.max(0, Math.min(w, p.x));
        p.y = Math.max(0, Math.min(h, p.y));
      }

      // Draw links
      const [lr, lg, lb] = linkColorRef.current;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DISTANCE) {
            const opacity = LINK_OPACITY * (1 - dist / LINK_DISTANCE);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${lr},${lg},${lb},${opacity})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      const colors = colorsRef.current;
      for (const p of particles) {
        const [r, g, b] = colors[p.colorIndex];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},0.4)`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    syncTheme();
    resize();
    initParticles();
    rafRef.current = requestAnimationFrame(draw);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };

    const handleResize = () => {
      resize();
      initParticles();
    };
    window.addEventListener("resize", handleResize, { passive: true });

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener(THEME_CHANGE_EVENT, syncTheme);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener(THEME_CHANGE_EVENT, syncTheme);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 block h-full w-full" />
  );
};

export default ParticleBackground;
